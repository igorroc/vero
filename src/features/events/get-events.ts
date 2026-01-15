"use server";

import prisma from "@/lib/db";
import {getUserBySession} from "@/lib/auth";
import type {Event, EventStatus, EventType} from "@prisma/client";
import {startOfDay, addDays} from "@/types/finance";
import {
    generateEventsFromTemplates,
    type RecurrenceTemplate,
} from "@/lib/engines/recurrence";

export interface GetEventsOptions {
    startDate?: Date;
    endDate?: Date;
    accountId?: string;
    status?: EventStatus;
    type?: EventType;
    includeRecurrenceGenerated?: boolean; // Generate future events from templates
}

export type GetEventsResult =
    | { success: true; events: Event[] }
    | { success: false; error: string };

/**
 * Get events with optional filters
 */
export async function getEvents(
    options: GetEventsOptions = {}
): Promise<GetEventsResult> {
    try {
        const user = await getUserBySession();
        if (!user) {
            return {success: false, error: "Not authenticated"};
        }

        const {
            startDate,
            endDate,
            accountId,
            status,
            type,
            includeRecurrenceGenerated = false,
        } = options;

        // Build where clause
        const where: Record<string, unknown> = {
            userId: user.id,
        };

        if (startDate || endDate) {
            where.date = {};
            if (startDate) (where.date as Record<string, Date>).gte = startOfDay(startDate);
            if (endDate) (where.date as Record<string, Date>).lte = startOfDay(endDate);
        }

        if (accountId) where.accountId = accountId;
        if (status) where.status = status;
        if (type) where.type = type;

        // Don't fetch recurrence templates when getting regular events
        if (!includeRecurrenceGenerated) {
            where.isRecurrenceTemplate = false;
        }

        const events = await prisma.event.findMany({
            where,
            orderBy: {date: "asc"},
            include: {
                account: {
                    select: {name: true},
                },
            },
        });

        return {success: true, events};
    } catch (error) {
        console.error("Failed to get events:", error);
        return {success: false, error: "Failed to fetch events"};
    }
}

/**
 * Get events with generated recurrence instances for projection
 */
export async function getEventsWithProjection(
    startDate: Date,
    endDate: Date
): Promise<GetEventsResult> {
    try {
        const user = await getUserBySession();
        if (!user) {
            return {success: false, error: "Not authenticated"};
        }

        const rangeStart = startOfDay(startDate);
        const rangeEnd = startOfDay(endDate);

        // Get all non-template events in the range
        const regularEvents = await prisma.event.findMany({
            where: {
                userId: user.id,
                isRecurrenceTemplate: false,
                date: {
                    gte: rangeStart,
                    lte: rangeEnd,
                },
            },
            orderBy: {date: "asc"},
        });

        // Get all recurrence templates
        const templates = await prisma.event.findMany({
            where: {
                userId: user.id,
                isRecurrenceTemplate: true,
            },
        });

        // Build map of existing events by template
        const existingByTemplate = new Map<string, Set<string>>();
        for (const event of regularEvents) {
            if (event.recurrenceId) {
                const existing = existingByTemplate.get(event.recurrenceId) || new Set();
                existing.add(event.date.toISOString().split("T")[0]);
                existingByTemplate.set(event.recurrenceId, existing);
            }
        }

        // Generate future events from templates
        const recurrenceTemplates: RecurrenceTemplate[] = templates
            .filter((t) => t.recurrenceFrequency)
            .map((t) => ({
                id: t.id,
                description: t.description,
                amount: t.amount,
                type: t.type,
                costType: t.costType,
                priority: t.priority,
                accountId: t.accountId,
                date: t.date,
                recurrenceFrequency: t.recurrenceFrequency!,
                recurrenceEndDate: t.recurrenceEndDate,
            }));

        const generatedEvents = generateEventsFromTemplates(
            recurrenceTemplates,
            {startDate: rangeStart, endDate: rangeEnd},
            existingByTemplate
        );

        // Convert generated events to Event-like objects
        const generatedAsEvents = generatedEvents.map((ge, index) => ({
            id: `generated-${ge.templateId}-${index}`,
            userId: user.id,
            accountId: ge.accountId,
            description: ge.description,
            amount: ge.amount,
            type: ge.type,
            costType: ge.costType,
            status: ge.status,
            priority: ge.priority,
            date: ge.date,
            isRecurrenceTemplate: false,
            recurrenceFrequency: null,
            recurrenceEndDate: null,
            recurrenceId: ge.templateId,
            createdAt: new Date(),
            updatedAt: new Date(),
        })) as Event[];

        // Combine and sort
        const allEvents = [...regularEvents, ...generatedAsEvents].sort(
            (a, b) => a.date.getTime() - b.date.getTime()
        );

        return {success: true, events: allEvents};
    } catch (error) {
        console.error("Failed to get events with projection:", error);
        return {success: false, error: "Failed to fetch events"};
    }
}

/**
 * Get upcoming events (next N days)
 */
export async function getUpcomingEvents(
    days: number = 7
): Promise<GetEventsResult> {
    const today = new Date();
    const endDate = addDays(today, days);

    return getEventsWithProjection(today, endDate);
}

/**
 * Get a single event by ID
 */
export async function getEventById(eventId: string): Promise<Event | null> {
    try {
        const user = await getUserBySession();
        if (!user) return null;

        return await prisma.event.findFirst({
            where: {
                id: eventId,
                userId: user.id,
            },
        });
    } catch (error) {
        console.error("Failed to get event:", error);
        return null;
    }
}
