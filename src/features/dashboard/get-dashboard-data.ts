"use server";

import prisma from "@/lib/db";
import {getUserBySession} from "@/lib/auth";
import {getAccountBalances, type AccountWithBalance} from "@/features/accounts";
import {getEventsWithProjection} from "@/features/events";
import {
    calculateSpendingLimitAuto,
    type SpendingLimitResult,
} from "@/lib/engines/spending-limit";
import {
    buildCashflowProjection,
    getProjectionSummary,
    findCriticalEvents,
} from "@/lib/engines/cashflow";
import type {
    Cents,
    CashflowEvent,
    HorizonMode,
} from "@/types/finance";
import {addDays, startOfDay} from "@/types/finance";

export interface DashboardData {
    // Balance info
    totalBalance: Cents;
    accounts: AccountWithBalance[];

    // Spending limit
    spendingLimit: SpendingLimitResult;

    // Upcoming events (next 7 days)
    upcomingEvents: Array<{
        id: string;
        description: string;
        amount: Cents;
        date: Date;
        type: string;
        status: string;
    }>;

    // Projection summary (30 days)
    projectionSummary: {
        startingBalance: Cents;
        endingBalance: Cents;
        netChange: Cents;
        avgDailySpend: Cents;
        daysUntilNegative: number | null;
    };

    // Critical events (events causing negative balance)
    criticalEvents: CashflowEvent[];

    // User settings
    horizonMode: HorizonMode;
    safetyBuffer: Cents;
}

export type GetDashboardDataResult =
    | { success: true; data: DashboardData }
    | { success: false; error: string };

export async function getDashboardData(): Promise<GetDashboardDataResult> {
    try {
        const user = await getUserBySession();
        if (!user) {
            return {success: false, error: "Not authenticated"};
        }

        // Get user settings
        let settings = await prisma.userSettings.findUnique({
            where: {userId: user.id},
        });

        // Create default settings if not exist
        if (!settings) {
            settings = await prisma.userSettings.create({
                data: {
                    userId: user.id,
                    safetyBuffer: 0,
                    horizonMode: "END_OF_MONTH",
                },
            });
        }

        // Get account balances
        const balancesResult = await getAccountBalances();
        if (!balancesResult.success) {
            return {success: false, error: balancesResult.error};
        }

        const {accounts, totalBalance} = balancesResult;

        // Get events for projection (next 90 days)
        const today = new Date();
        const projectionEnd = addDays(today, 90);

        const eventsResult = await getEventsWithProjection(today, projectionEnd);
        if (!eventsResult.success) {
            return {success: false, error: eventsResult.error};
        }

        // Map events for spending limit calculation
        const eventsForCalculation = eventsResult.events.map((e) => ({
            amount: e.amount,
            type: e.type,
            status: e.status,
            date: e.date,
        }));

        // Calculate spending limit
        const spendingLimit = calculateSpendingLimitAuto(
            totalBalance,
            eventsForCalculation,
            settings.horizonMode,
            settings.safetyBuffer,
            today
        );

        // Get upcoming events (next 7 days)
        const upcomingEnd = addDays(today, 7);
        const upcomingEvents = eventsResult.events
            .filter(
                (e) =>
                    startOfDay(e.date).getTime() <= startOfDay(upcomingEnd).getTime() &&
                    e.status !== "SKIPPED"
            )
            .map((e) => ({
                id: e.id,
                description: e.description,
                amount: e.amount,
                date: e.date,
                type: e.type,
                status: e.status,
            }));

        // Build cashflow projection for summary
        const projection = buildCashflowProjection({
            accounts: accounts.map((a) => ({
                id: a.id,
                name: a.name,
                initialBalance: a.currentBalance, // Use current balance as starting point
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
            safetyBuffer: settings.safetyBuffer,
        });

        const projectionSummary = getProjectionSummary(projection);
        const criticalEvents = findCriticalEvents(projection);

        return {
            success: true,
            data: {
                totalBalance,
                accounts,
                spendingLimit,
                upcomingEvents,
                projectionSummary,
                criticalEvents,
                horizonMode: settings.horizonMode,
                safetyBuffer: settings.safetyBuffer,
            },
        };
    } catch (error) {
        console.error("Failed to get dashboard data:", error);
        return {success: false, error: "Failed to load dashboard"};
    }
}
