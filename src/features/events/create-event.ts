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

export interface CreateEventInput {
  accountId: string;
  description: string;
  amount: number; // In dollars, positive for income, negative for expense
  type: EventType;
  costType?: CostType | null; // Only for EXPENSE type
  status?: EventStatus;
  priority?: EventPriority; // Default: IMPORTANT
  date: Date;
  // Recurrence
  isRecurring?: boolean;
  recurrenceFrequency?: RecurrenceFrequency;
  recurrenceEndDate?: Date | null;
}

export type CreateEventResult =
  | { success: true; event: Event }
  | { success: false; error: string };

export async function createEvent(
  input: CreateEventInput
): Promise<CreateEventResult> {
  try {
    const user = await getUserBySession();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Validate account ownership
    const account = await prisma.account.findFirst({
      where: {
        id: input.accountId,
        userId: user.id,
      },
    });

    if (!account) {
      return { success: false, error: "Account not found" };
    }

    // Validate input
    if (!input.description || input.description.trim().length === 0) {
      return { success: false, error: "Description is required" };
    }

    if (!["INCOME", "EXPENSE", "INVESTMENT"].includes(input.type)) {
      return { success: false, error: "Invalid event type" };
    }

    // Validate cost type for expenses
    if (input.type === "EXPENSE" && input.costType) {
      if (!["RECURRENT", "EXCEPTIONAL"].includes(input.costType)) {
        return { success: false, error: "Invalid cost type" };
      }
    }

    // Convert amount to cents
    // For expenses and investments, ensure amount is negative
    let amountCents = dollarsToCents(Math.abs(input.amount));
    if (input.type === "EXPENSE" || input.type === "INVESTMENT") {
      amountCents = -amountCents;
    }

    // Create the event
    const eventData = {
      userId: user.id,
      accountId: input.accountId,
      description: input.description.trim(),
      amount: amountCents,
      type: input.type,
      costType: input.type === "EXPENSE" ? input.costType ?? "RECURRENT" : null,
      status: input.status ?? "PLANNED",
      priority: input.priority ?? "IMPORTANT",
      date: input.date,
      isRecurrenceTemplate: input.isRecurring ?? false,
      recurrenceFrequency: input.isRecurring ? input.recurrenceFrequency : null,
      recurrenceEndDate: input.isRecurring ? input.recurrenceEndDate : null,
    };

    const event = await prisma.event.create({
      data: eventData,
    });

    return { success: true, event };
  } catch (error) {
    console.error("Failed to create event:", error);
    return { success: false, error: "Failed to create event" };
  }
}

/**
 * Create an instance of a recurring event
 * This is used when confirming or skipping a generated occurrence
 */
export async function createRecurrenceInstance(
  templateId: string,
  date: Date,
  status: EventStatus
): Promise<CreateEventResult> {
  try {
    const user = await getUserBySession();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Get the template
    const template = await prisma.event.findFirst({
      where: {
        id: templateId,
        userId: user.id,
        isRecurrenceTemplate: true,
      },
    });

    if (!template) {
      return { success: false, error: "Template not found" };
    }

    // Create instance linked to template
    const event = await prisma.event.create({
      data: {
        userId: user.id,
        accountId: template.accountId,
        description: template.description,
        amount: template.amount,
        type: template.type,
        costType: template.costType,
        status,
        priority: template.priority,
        date,
        isRecurrenceTemplate: false,
        recurrenceId: templateId,
      },
    });

    return { success: true, event };
  } catch (error) {
    console.error("Failed to create recurrence instance:", error);
    return { success: false, error: "Failed to create event instance" };
  }
}
