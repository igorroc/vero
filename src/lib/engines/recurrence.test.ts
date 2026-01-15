import { describe, it, expect } from "vitest";
import {
  getNextOccurrence,
  generateOccurrences,
  generateEventsFromTemplates,
  type RecurrenceTemplate,
} from "./recurrence";

// Helper to create dates in UTC
function utcDate(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day));
}

describe("getNextOccurrence", () => {
  describe("DAILY frequency", () => {
    it("should add one day", () => {
      const date = utcDate(2024, 1, 15);
      const next = getNextOccurrence(date, "DAILY");
      expect(next.toISOString().split("T")[0]).toBe("2024-01-16");
    });

    it("should handle month boundary", () => {
      const date = utcDate(2024, 1, 31);
      const next = getNextOccurrence(date, "DAILY");
      expect(next.toISOString().split("T")[0]).toBe("2024-02-01");
    });
  });

  describe("WEEKLY frequency", () => {
    it("should add 7 days", () => {
      const date = utcDate(2024, 1, 15);
      const next = getNextOccurrence(date, "WEEKLY");
      expect(next.toISOString().split("T")[0]).toBe("2024-01-22");
    });

    it("should handle month boundary", () => {
      const date = utcDate(2024, 1, 29);
      const next = getNextOccurrence(date, "WEEKLY");
      expect(next.toISOString().split("T")[0]).toBe("2024-02-05");
    });
  });

  describe("BIWEEKLY frequency", () => {
    it("should add 14 days", () => {
      const date = utcDate(2024, 1, 15);
      const next = getNextOccurrence(date, "BIWEEKLY");
      expect(next.toISOString().split("T")[0]).toBe("2024-01-29");
    });
  });

  describe("MONTHLY frequency", () => {
    it("should add one month to normal day", () => {
      const date = utcDate(2024, 1, 15);
      const next = getNextOccurrence(date, "MONTHLY");
      expect(next.toISOString().split("T")[0]).toBe("2024-02-15");
    });

    it("should handle Jan 31 -> Feb 29 (leap year)", () => {
      const date = utcDate(2024, 1, 31);
      const next = getNextOccurrence(date, "MONTHLY");
      // Feb has 29 days in 2024 (leap year)
      expect(next.toISOString().split("T")[0]).toBe("2024-02-29");
    });

    it("should handle Jan 31 -> Feb 28 (non-leap year)", () => {
      const date = utcDate(2023, 1, 31);
      const next = getNextOccurrence(date, "MONTHLY");
      // Feb has 28 days in 2023
      expect(next.toISOString().split("T")[0]).toBe("2023-02-28");
    });

    it("should handle March 31 -> April 30", () => {
      const date = utcDate(2024, 3, 31);
      const next = getNextOccurrence(date, "MONTHLY");
      expect(next.toISOString().split("T")[0]).toBe("2024-04-30");
    });
  });

  describe("YEARLY frequency", () => {
    it("should add one year", () => {
      const date = utcDate(2024, 6, 15);
      const next = getNextOccurrence(date, "YEARLY");
      expect(next.toISOString().split("T")[0]).toBe("2025-06-15");
    });

    it("should handle Feb 29 on leap year -> Feb 28 on non-leap year", () => {
      const date = utcDate(2024, 2, 29);
      const next = getNextOccurrence(date, "YEARLY");
      expect(next.toISOString().split("T")[0]).toBe("2025-02-28");
    });
  });
});

describe("generateOccurrences", () => {
  const baseTemplate: RecurrenceTemplate = {
    id: "template-1",
    description: "Monthly rent",
    amount: -150000, // $1500
    type: "EXPENSE",
    costType: "RECURRENT",
    accountId: "account-1",
    date: utcDate(2024, 1, 5), // First occurrence: Jan 5, 2024
    priority: "IMPORTANT" as const,
        recurrenceFrequency: "MONTHLY",
    recurrenceEndDate: null,
  };

  it("should generate monthly occurrences within range", () => {
    const events = generateOccurrences(baseTemplate, {
      startDate: utcDate(2024, 1, 1),
      endDate: utcDate(2024, 3, 31),
    });

    expect(events).toHaveLength(3);
    expect(events[0].date.toISOString().split("T")[0]).toBe("2024-01-05");
    expect(events[1].date.toISOString().split("T")[0]).toBe("2024-02-05");
    expect(events[2].date.toISOString().split("T")[0]).toBe("2024-03-05");
  });

  it("should respect recurrence end date", () => {
    const template: RecurrenceTemplate = {
      ...baseTemplate,
      recurrenceEndDate: utcDate(2024, 2, 15),
    };

    const events = generateOccurrences(template, {
      startDate: utcDate(2024, 1, 1),
      endDate: utcDate(2024, 6, 30),
    });

    expect(events).toHaveLength(2);
    expect(events[0].date.toISOString().split("T")[0]).toBe("2024-01-05");
    expect(events[1].date.toISOString().split("T")[0]).toBe("2024-02-05");
  });

  it("should skip dates that already exist", () => {
    const existingDates = new Set(["2024-02-05"]);

    const events = generateOccurrences(baseTemplate, {
      startDate: utcDate(2024, 1, 1),
      endDate: utcDate(2024, 3, 31),
      existingEventDates: existingDates,
    });

    expect(events).toHaveLength(2);
    expect(events[0].date.toISOString().split("T")[0]).toBe("2024-01-05");
    expect(events[1].date.toISOString().split("T")[0]).toBe("2024-03-05");
  });

  it("should start from range start if template begins before", () => {
    const template: RecurrenceTemplate = {
      ...baseTemplate,
      date: utcDate(2023, 6, 5), // Started 6 months before range
    };

    const events = generateOccurrences(template, {
      startDate: utcDate(2024, 1, 1),
      endDate: utcDate(2024, 2, 28),
    });

    expect(events).toHaveLength(2);
    expect(events[0].date.toISOString().split("T")[0]).toBe("2024-01-05");
    expect(events[1].date.toISOString().split("T")[0]).toBe("2024-02-05");
  });

  it("should return empty array if template starts after range", () => {
    const template: RecurrenceTemplate = {
      ...baseTemplate,
      date: utcDate(2024, 6, 5), // Starts after range
    };

    const events = generateOccurrences(template, {
      startDate: utcDate(2024, 1, 1),
      endDate: utcDate(2024, 3, 31),
    });

    expect(events).toHaveLength(0);
  });

  it("should generate daily occurrences correctly", () => {
    const template: RecurrenceTemplate = {
      ...baseTemplate,
      priority: "IMPORTANT" as const,
        recurrenceFrequency: "DAILY",
    };

    const events = generateOccurrences(template, {
      startDate: utcDate(2024, 1, 5),
      endDate: utcDate(2024, 1, 9),
    });

    expect(events).toHaveLength(5);
  });

  it("should set status to PLANNED for all generated events", () => {
    const events = generateOccurrences(baseTemplate, {
      startDate: utcDate(2024, 1, 1),
      endDate: utcDate(2024, 3, 31),
    });

    expect(events.every((e) => e.status === "PLANNED")).toBe(true);
  });

  it("should preserve template properties in generated events", () => {
    const events = generateOccurrences(baseTemplate, {
      startDate: utcDate(2024, 1, 1),
      endDate: utcDate(2024, 1, 31),
    });

    expect(events[0]).toMatchObject({
      templateId: "template-1",
      description: "Monthly rent",
      amount: -150000,
      type: "EXPENSE",
      costType: "RECURRENT",
      accountId: "account-1",
    });
  });
});

describe("generateEventsFromTemplates", () => {
  it("should generate events from multiple templates and sort by date", () => {
    const templates: RecurrenceTemplate[] = [
      {
        id: "rent",
        description: "Rent",
        amount: -150000,
        type: "EXPENSE",
        costType: "RECURRENT",
        accountId: "account-1",
        date: utcDate(2024, 1, 5),
        priority: "IMPORTANT" as const,
        recurrenceFrequency: "MONTHLY",
        recurrenceEndDate: null,
      },
      {
        id: "salary",
        description: "Salary",
        amount: 500000,
        type: "INCOME",
        costType: null,
        accountId: "account-1",
        date: utcDate(2024, 1, 1),
        priority: "IMPORTANT" as const,
        recurrenceFrequency: "MONTHLY",
        recurrenceEndDate: null,
      },
    ];

    const events = generateEventsFromTemplates(templates, {
      startDate: utcDate(2024, 1, 1),
      endDate: utcDate(2024, 2, 28),
    });

    expect(events).toHaveLength(4);
    // Should be sorted by date
    expect(events[0].description).toBe("Salary");
    expect(events[0].date.toISOString().split("T")[0]).toBe("2024-01-01");
    expect(events[1].description).toBe("Rent");
    expect(events[1].date.toISOString().split("T")[0]).toBe("2024-01-05");
    expect(events[2].description).toBe("Salary");
    expect(events[2].date.toISOString().split("T")[0]).toBe("2024-02-01");
    expect(events[3].description).toBe("Rent");
    expect(events[3].date.toISOString().split("T")[0]).toBe("2024-02-05");
  });

  it("should use existing events map to skip dates per template", () => {
    const templates: RecurrenceTemplate[] = [
      {
        id: "rent",
        description: "Rent",
        amount: -150000,
        type: "EXPENSE",
        costType: "RECURRENT",
        accountId: "account-1",
        date: utcDate(2024, 1, 5),
        priority: "IMPORTANT" as const,
        recurrenceFrequency: "MONTHLY",
        recurrenceEndDate: null,
      },
    ];

    const existingByTemplate = new Map([["rent", new Set(["2024-01-05"])]]);

    const events = generateEventsFromTemplates(
      templates,
      { startDate: utcDate(2024, 1, 1), endDate: utcDate(2024, 2, 28) },
      existingByTemplate
    );

    expect(events).toHaveLength(1);
    expect(events[0].date.toISOString().split("T")[0]).toBe("2024-02-05");
  });
});

describe("determinism", () => {
  it("should produce identical results for same inputs", () => {
    const template: RecurrenceTemplate = {
      id: "test",
      description: "Test",
      amount: -10000,
      type: "EXPENSE",
      costType: "RECURRENT",
      accountId: "acc-1",
      date: utcDate(2024, 1, 15),
      priority: "IMPORTANT" as const,
        recurrenceFrequency: "WEEKLY",
      recurrenceEndDate: null,
    };

    const options = {
      startDate: utcDate(2024, 1, 1),
      endDate: utcDate(2024, 3, 31),
    };

    const result1 = generateOccurrences(template, options);
    const result2 = generateOccurrences(template, options);

    expect(result1).toEqual(result2);
    expect(result1.map((e) => e.date.toISOString())).toEqual(
      result2.map((e) => e.date.toISOString())
    );
  });
});
