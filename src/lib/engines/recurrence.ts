import type { RecurrenceFrequency, EventType, EventStatus, CostType } from "@prisma/client";
import { addDays, startOfDay } from "@/types/finance";

// ============================================
// TYPES
// ============================================

/**
 * Template event for recurrence generation
 */
export interface RecurrenceTemplate {
  id: string;
  description: string;
  amount: number; // In cents
  type: EventType;
  costType: CostType | null;
  accountId: string;
  date: Date; // First occurrence date
  recurrenceFrequency: RecurrenceFrequency;
  recurrenceEndDate: Date | null;
}

/**
 * Generated event from recurrence
 */
export interface GeneratedEvent {
  templateId: string;
  description: string;
  amount: number;
  type: EventType;
  costType: CostType | null;
  status: EventStatus;
  accountId: string;
  date: Date;
}

/**
 * Options for recurrence generation
 */
export interface RecurrenceOptions {
  startDate: Date;
  endDate: Date;
  existingEventDates?: Set<string>; // ISO date strings of existing events for this template
}

// ============================================
// CORE FUNCTIONS
// ============================================

/**
 * Get the next occurrence date based on frequency
 */
export function getNextOccurrence(
  currentDate: Date,
  frequency: RecurrenceFrequency
): Date {
  const date = new Date(currentDate);

  switch (frequency) {
    case "DAILY":
      date.setUTCDate(date.getUTCDate() + 1);
      break;
    case "WEEKLY":
      date.setUTCDate(date.getUTCDate() + 7);
      break;
    case "BIWEEKLY":
      date.setUTCDate(date.getUTCDate() + 14);
      break;
    case "MONTHLY":
      // Handle month-end edge cases (e.g., Jan 31 -> Feb 28)
      const originalDay = date.getUTCDate();
      date.setUTCMonth(date.getUTCMonth() + 1);
      // If the day changed (overflow), go to last day of previous month
      if (date.getUTCDate() !== originalDay) {
        date.setUTCDate(0); // Last day of previous month
      }
      break;
    case "YEARLY":
      date.setUTCFullYear(date.getUTCFullYear() + 1);
      // Handle Feb 29 on non-leap years
      if (date.getUTCMonth() === 2 && date.getUTCDate() === 1) {
        date.setUTCDate(0); // Feb 28
      }
      break;
  }

  return startOfDay(date);
}

/**
 * Generate all occurrences for a recurrence template within a date range
 *
 * This function is deterministic - given the same inputs, it will always
 * produce the same outputs in the same order.
 */
export function generateOccurrences(
  template: RecurrenceTemplate,
  options: RecurrenceOptions
): GeneratedEvent[] {
  const { startDate, endDate, existingEventDates } = options;
  const events: GeneratedEvent[] = [];

  // Normalize dates to start of day
  const rangeStart = startOfDay(startDate);
  const rangeEnd = startOfDay(endDate);
  const templateStart = startOfDay(template.date);
  const templateEnd = template.recurrenceEndDate
    ? startOfDay(template.recurrenceEndDate)
    : null;

  // Start from the template's first occurrence
  let currentDate = templateStart;

  // If template starts before range, advance to first occurrence in range
  while (currentDate < rangeStart) {
    currentDate = getNextOccurrence(currentDate, template.recurrenceFrequency);
  }

  // Generate all occurrences within range
  while (currentDate <= rangeEnd) {
    // Check if we've passed the recurrence end date
    if (templateEnd && currentDate > templateEnd) {
      break;
    }

    // Check if this occurrence already exists
    const dateKey = currentDate.toISOString().split("T")[0];
    const alreadyExists = existingEventDates?.has(dateKey) ?? false;

    if (!alreadyExists) {
      events.push({
        templateId: template.id,
        description: template.description,
        amount: template.amount,
        type: template.type,
        costType: template.costType,
        status: "PLANNED", // Generated events are always planned
        accountId: template.accountId,
        date: new Date(currentDate),
      });
    }

    // Move to next occurrence
    currentDate = getNextOccurrence(currentDate, template.recurrenceFrequency);
  }

  return events;
}

/**
 * Generate events from multiple templates
 */
export function generateEventsFromTemplates(
  templates: RecurrenceTemplate[],
  options: RecurrenceOptions,
  existingEventsByTemplate?: Map<string, Set<string>>
): GeneratedEvent[] {
  const allEvents: GeneratedEvent[] = [];

  for (const template of templates) {
    const existingDates = existingEventsByTemplate?.get(template.id);
    const events = generateOccurrences(template, {
      ...options,
      existingEventDates: existingDates,
    });
    allEvents.push(...events);
  }

  // Sort by date
  allEvents.sort((a, b) => a.date.getTime() - b.date.getTime());

  return allEvents;
}

/**
 * Get the interval description for a frequency
 */
export function getFrequencyLabel(frequency: RecurrenceFrequency): string {
  switch (frequency) {
    case "DAILY":
      return "Daily";
    case "WEEKLY":
      return "Weekly";
    case "BIWEEKLY":
      return "Every 2 weeks";
    case "MONTHLY":
      return "Monthly";
    case "YEARLY":
      return "Yearly";
  }
}

/**
 * Calculate the default projection horizon (90 days)
 */
export function getDefaultProjectionHorizon(from: Date = new Date()): Date {
  return addDays(startOfDay(from), 90);
}
