"use server";

import prisma from "@/lib/db";
import {getUserBySession} from "@/lib/auth";
import type {Notification, NotificationType} from "@prisma/client";
import {getEventsWithProjection} from "@/features/events";
import {buildCashflowProjection} from "@/lib/engines/cashflow";
import {getAccountBalances} from "@/features/accounts";
import {addDays, startOfDay, formatCurrency} from "@/types/finance";

// ============================================
// GET NOTIFICATIONS
// ============================================

export type GetNotificationsResult =
    | { success: true; notifications: Notification[] }
    | { success: false; error: string };

export async function getNotifications(): Promise<GetNotificationsResult> {
    try {
        const user = await getUserBySession();
        if (!user) {
            return {success: false, error: "Not authenticated"};
        }

        const notifications = await prisma.notification.findMany({
            where: {
                userId: user.id,
                isRead: false,
            },
            orderBy: {createdAt: "desc"},
            take: 20,
        });

        return {success: true, notifications};
    } catch (error) {
        console.error("Failed to get notifications:", error);
        return {success: false, error: "Failed to fetch notifications"};
    }
}

// ============================================
// MARK AS READ
// ============================================

export type MarkNotificationReadResult =
    | { success: true }
    | { success: false; error: string };

export async function markNotificationRead(
    notificationId: string
): Promise<MarkNotificationReadResult> {
    try {
        const user = await getUserBySession();
        if (!user) {
            return {success: false, error: "Not authenticated"};
        }

        await prisma.notification.updateMany({
            where: {
                id: notificationId,
                userId: user.id,
            },
            data: {isRead: true},
        });

        return {success: true};
    } catch (error) {
        console.error("Failed to mark notification read:", error);
        return {success: false, error: "Failed to update notification"};
    }
}

export async function markAllNotificationsRead(): Promise<MarkNotificationReadResult> {
    try {
        const user = await getUserBySession();
        if (!user) {
            return {success: false, error: "Not authenticated"};
        }

        await prisma.notification.updateMany({
            where: {
                userId: user.id,
                isRead: false,
            },
            data: {isRead: true},
        });

        return {success: true};
    } catch (error) {
        console.error("Failed to mark all notifications read:", error);
        return {success: false, error: "Failed to update notifications"};
    }
}

// ============================================
// GENERATE NOTIFICATIONS
// ============================================

interface GeneratedNotification {
    type: NotificationType;
    title: string;
    message: string;
    eventId?: string;
    expiresAt?: Date;
}

/**
 * Generate notifications based on current financial state
 * This should be called periodically (e.g., on login or via cron)
 */
export async function generateNotifications(): Promise<void> {
    try {
        const user = await getUserBySession();
        if (!user) return;

        const today = startOfDay(new Date());
        const notifications: GeneratedNotification[] = [];

        // Get events for the next 7 days
        const eventsResult = await getEventsWithProjection(today, addDays(today, 7));
        if (!eventsResult.success) return;

        // Get account balances for projection
        const balancesResult = await getAccountBalances();
        if (!balancesResult.success) return;

        // Check for upcoming payments (D-7, D-3, D-1, D-0)
        const upcomingPayments = eventsResult.events.filter(
            (e) => e.status === "PLANNED" && e.amount < 0
        );

        for (const event of upcomingPayments) {
            const eventDate = startOfDay(event.date);
            const daysUntil = Math.floor(
                (eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
            );

            // Only create notification if it doesn't already exist
            if ([0, 1, 3, 7].includes(daysUntil)) {
                const existing = await prisma.notification.findFirst({
                    where: {
                        userId: user.id,
                        eventId: event.id,
                        type: "UPCOMING_PAYMENT",
                        createdAt: {
                            gte: addDays(today, -1), // Created within last day
                        },
                    },
                });

                if (!existing) {
                    const dayLabel =
                        daysUntil === 0
                            ? "today"
                            : daysUntil === 1
                                ? "tomorrow"
                                : `in ${daysUntil} days`;

                    notifications.push({
                        type: "UPCOMING_PAYMENT",
                        title: `Payment Due ${daysUntil === 0 ? "Today" : "Soon"}`,
                        message: `${event.description} (${formatCurrency(
                            Math.abs(event.amount)
                        )}) is due ${dayLabel}.`,
                        eventId: event.id,
                        expiresAt: addDays(eventDate, 1),
                    });
                }
            }
        }

        // Check for negative cashflow
        const projection = buildCashflowProjection({
            accounts: balancesResult.accounts.map((a) => ({
                id: a.id,
                name: a.name,
                initialBalance: a.currentBalance,
            })),
            events: eventsResult.events
                .filter((e) => e.status !== "SKIPPED")
                .map((e) => ({
                    id: e.id,
                    description: e.description,
                    amount: e.amount,
                    type: e.type,
                    costType: e.costType,
                    status: e.status,
                    date: e.date,
                    accountId: e.accountId,
                })),
            startDate: today,
            endDate: addDays(today, 30),
        });

        if (projection.negativeDays > 0) {
            const existing = await prisma.notification.findFirst({
                where: {
                    userId: user.id,
                    type: "NEGATIVE_CASHFLOW",
                    createdAt: {
                        gte: addDays(today, -1),
                    },
                },
            });

            if (!existing) {
                notifications.push({
                    type: "NEGATIVE_CASHFLOW",
                    title: "Negative Balance Warning",
                    message: `Your balance is projected to go negative within the next 30 days. Review your upcoming expenses.`,
                    expiresAt: addDays(today, 7),
                });
            }
        }

        // Create notifications
        for (const notification of notifications) {
            await prisma.notification.create({
                data: {
                    userId: user.id,
                    type: notification.type,
                    title: notification.title,
                    message: notification.message,
                    eventId: notification.eventId,
                    expiresAt: notification.expiresAt,
                },
            });
        }
    } catch (error) {
        console.error("Failed to generate notifications:", error);
    }
}

// ============================================
// COUNT UNREAD
// ============================================

export async function getUnreadCount(): Promise<number> {
    try {
        const user = await getUserBySession();
        if (!user) return 0;

        return await prisma.notification.count({
            where: {
                userId: user.id,
                isRead: false,
            },
        });
    } catch (error) {
        console.error("Failed to get unread count:", error);
        return 0;
    }
}
