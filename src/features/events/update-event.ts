"use server";

import prisma from "@/lib/db";
import { getUserBySession } from "@/lib/auth";
import type {
  Event,
  EventType,
  EventStatus,
  EventPriority,
  CostType,
  RecurrenceFrequency,
} from "@prisma/client";
import { dollarsToCents } from "@/types/finance";

export interface UpdateEventInput {
  id: string;
  accountId?: string;
  description?: string;
  amount?: number; // In dollars
  type?: EventType;
  costType?: CostType | null;
  status?: EventStatus;
  priority?: EventPriority;
  date?: Date;
  recurrenceFrequency?: RecurrenceFrequency | null;
  recurrenceEndDate?: Date | null;
}

export type UpdateEventResult =
  | { success: true; event: Event }
  | { success: false; error: string };

export async function updateEvent(
  input: UpdateEventInput
): Promise<UpdateEventResult> {
  try {
    const user = await getUserBySession();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Verify ownership
    const existing = await prisma.event.findFirst({
      where: {
        id: input.id,
        userId: user.id,
      },
    });

    if (!existing) {
      return { success: false, error: "Event not found" };
    }

    // If changing account, verify new account ownership
    if (input.accountId && input.accountId !== existing.accountId) {
      const newAccount = await prisma.account.findFirst({
        where: {
          id: input.accountId,
          userId: user.id,
        },
      });

      if (!newAccount) {
        return { success: false, error: "Account not found" };
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (input.accountId !== undefined) {
      updateData.accountId = input.accountId;
    }

    if (input.description !== undefined) {
      if (input.description.trim().length === 0) {
        return { success: false, error: "Description cannot be empty" };
      }
      updateData.description = input.description.trim();
    }

    if (input.amount !== undefined) {
      const eventType = input.type ?? existing.type;
      let amountCents = dollarsToCents(Math.abs(input.amount));
      if (eventType === "EXPENSE" || eventType === "INVESTMENT") {
        amountCents = -amountCents;
      }
      updateData.amount = amountCents;
    }

    if (input.type !== undefined) {
      if (!["INCOME", "EXPENSE", "INVESTMENT"].includes(input.type)) {
        return { success: false, error: "Invalid event type" };
      }
      updateData.type = input.type;

      // Clear costType if not expense
      if (input.type !== "EXPENSE") {
        updateData.costType = null;
      }
    }

    if (input.costType !== undefined) {
      const eventType = input.type ?? existing.type;
      if (eventType === "EXPENSE") {
        updateData.costType = input.costType;
      }
    }

    if (input.status !== undefined) {
      if (!["PLANNED", "CONFIRMED", "SKIPPED"].includes(input.status)) {
        return { success: false, error: "Invalid status" };
      }
      updateData.status = input.status;
    }

    if (input.priority !== undefined) {
      if (!["REQUIRED", "IMPORTANT", "OPTIONAL"].includes(input.priority)) {
        return { success: false, error: "Invalid priority" };
      }
      updateData.priority = input.priority;
    }

    if (input.date !== undefined) {
      updateData.date = input.date;
    }

    if (input.recurrenceFrequency !== undefined) {
      updateData.recurrenceFrequency = input.recurrenceFrequency;
    }

    if (input.recurrenceEndDate !== undefined) {
      updateData.recurrenceEndDate = input.recurrenceEndDate;
    }

    const event = await prisma.event.update({
      where: { id: input.id },
      data: updateData,
    });

    return { success: true, event };
  } catch (error) {
    console.error("Failed to update event:", error);
    return { success: false, error: "Failed to update event" };
  }
}

/**
 * Update event status (confirm, skip, etc.)
 */
export async function updateEventStatus(
  eventId: string,
  status: EventStatus
): Promise<UpdateEventResult> {
  return updateEvent({ id: eventId, status });
}

/**
 * Confirm a planned event
 */
export async function confirmEvent(eventId: string): Promise<UpdateEventResult> {
  return updateEventStatus(eventId, "CONFIRMED");
}

/**
 * Skip a planned event
 */
export async function skipEvent(eventId: string): Promise<UpdateEventResult> {
  return updateEventStatus(eventId, "SKIPPED");
}

/**
 * Mark event as planned again
 */
export async function unconfirmEvent(eventId: string): Promise<UpdateEventResult> {
  return updateEventStatus(eventId, "PLANNED");
}

/**
 * Update event priority
 */
export async function updateEventPriority(
  eventId: string,
  priority: EventPriority
): Promise<UpdateEventResult> {
  return updateEvent({ id: eventId, priority });
}
