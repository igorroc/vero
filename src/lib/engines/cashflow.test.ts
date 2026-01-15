import { describe, it, expect } from "vitest";
import {
  buildCashflowProjection,
  getAccountBalances,
  getCurrentBalance,
  findCriticalEvents,
  getProjectionSummary,
} from "./cashflow";
import type { CashflowInput } from "@/types/finance";

// Helper to create dates in UTC
function utcDate(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day));
}

describe("buildCashflowProjection", () => {
  const baseInput: CashflowInput = {
    accounts: [{ id: "acc-1", name: "Checking", initialBalance: 100000 }], // $1000
    events: [],
    startDate: utcDate(2024, 1, 1),
    endDate: utcDate(2024, 1, 5),
  };

  it("should create correct number of days", () => {
    const result = buildCashflowProjection(baseInput);
    expect(result.days).toHaveLength(5);
  });

  it("should maintain starting balance with no events", () => {
    const result = buildCashflowProjection(baseInput);

    expect(result.days[0].startingBalance).toBe(100000);
    expect(result.days[0].endingBalance).toBe(100000);
    expect(result.days[4].endingBalance).toBe(100000);
  });

  it("should apply confirmed events to balance", () => {
    const input: CashflowInput = {
      ...baseInput,
      events: [
        {
          id: "e1",
          description: "Grocery",
          amount: -5000, // -$50
          type: "EXPENSE",
          costType: "RECURRENT",
          status: "CONFIRMED",
          priority: "IMPORTANT" as const,
          date: utcDate(2024, 1, 2),
          accountId: "acc-1",
        },
      ],
    };

    const result = buildCashflowProjection(input);

    // Day 1 (Jan 1): no events, balance stays at $1000
    expect(result.days[0].endingBalance).toBe(100000);

    // Day 2 (Jan 2): -$50 expense
    expect(result.days[1].startingBalance).toBe(100000);
    expect(result.days[1].netChange).toBe(-5000);
    expect(result.days[1].endingBalance).toBe(95000);

    // Day 3-5: balance stays at $950
    expect(result.days[4].endingBalance).toBe(95000);
  });

  it("should include planned events in projection", () => {
    const input: CashflowInput = {
      ...baseInput,
      events: [
        {
          id: "e1",
          description: "Planned expense",
          amount: -20000, // -$200
          type: "EXPENSE",
          costType: "RECURRENT",
          status: "PLANNED",
          priority: "IMPORTANT" as const,
          date: utcDate(2024, 1, 3),
          accountId: "acc-1",
        },
      ],
    };

    const result = buildCashflowProjection(input);

    expect(result.days[2].netChange).toBe(-20000);
    expect(result.days[2].endingBalance).toBe(80000);
  });

  it("should ignore skipped events", () => {
    const input: CashflowInput = {
      ...baseInput,
      events: [
        {
          id: "e1",
          description: "Skipped expense",
          amount: -50000,
          type: "EXPENSE",
          costType: "EXCEPTIONAL",
          status: "SKIPPED",
          priority: "IMPORTANT" as const,
          date: utcDate(2024, 1, 2),
          accountId: "acc-1",
        },
      ],
    };

    const result = buildCashflowProjection(input);

    expect(result.days[1].netChange).toBe(0);
    expect(result.days[1].events).toHaveLength(0);
    expect(result.days[4].endingBalance).toBe(100000);
  });

  it("should handle income events (positive amounts)", () => {
    const input: CashflowInput = {
      ...baseInput,
      events: [
        {
          id: "e1",
          description: "Salary",
          amount: 500000, // +$5000
          type: "INCOME",
          costType: null,
          status: "PLANNED",
          priority: "IMPORTANT" as const,
          date: utcDate(2024, 1, 1),
          accountId: "acc-1",
        },
      ],
    };

    const result = buildCashflowProjection(input);

    expect(result.days[0].netChange).toBe(500000);
    expect(result.days[0].endingBalance).toBe(600000);
    expect(result.totalIncome).toBe(500000);
  });

  it("should track totals correctly", () => {
    const input: CashflowInput = {
      ...baseInput,
      events: [
        {
          id: "e1",
          description: "Salary",
          amount: 500000,
          type: "INCOME",
          costType: null,
          status: "CONFIRMED",
          priority: "IMPORTANT" as const,
          date: utcDate(2024, 1, 1),
          accountId: "acc-1",
        },
        {
          id: "e2",
          description: "Rent",
          amount: -150000,
          type: "EXPENSE",
          costType: "RECURRENT",
          status: "PLANNED",
          priority: "IMPORTANT" as const,
          date: utcDate(2024, 1, 5),
          accountId: "acc-1",
        },
        {
          id: "e3",
          description: "Investment",
          amount: -100000,
          type: "INVESTMENT",
          costType: null,
          status: "PLANNED",
          priority: "IMPORTANT" as const,
          date: utcDate(2024, 1, 3),
          accountId: "acc-1",
        },
      ],
    };

    const result = buildCashflowProjection(input);

    expect(result.totalIncome).toBe(500000);
    expect(result.totalExpenses).toBe(150000);
    expect(result.totalInvestments).toBe(100000);
    expect(result.netChange).toBe(250000); // 500k - 150k - 100k
  });

  it("should detect negative balance days", () => {
    const input: CashflowInput = {
      accounts: [{ id: "acc-1", name: "Checking", initialBalance: 10000 }], // $100
      events: [
        {
          id: "e1",
          description: "Big expense",
          amount: -50000, // -$500
          type: "EXPENSE",
          costType: "EXCEPTIONAL",
          status: "PLANNED",
          priority: "IMPORTANT" as const,
          date: utcDate(2024, 1, 3),
          accountId: "acc-1",
        },
      ],
      startDate: utcDate(2024, 1, 1),
      endDate: utcDate(2024, 1, 5),
    };

    const result = buildCashflowProjection(input);

    expect(result.days[2].isNegative).toBe(true);
    expect(result.days[2].endingBalance).toBe(-40000);
    expect(result.negativeDays).toBe(3); // Days 3, 4, 5
    expect(result.lowestBalance).toBe(-40000);
  });

  it("should detect critical balance days (below safety buffer)", () => {
    const input: CashflowInput = {
      accounts: [{ id: "acc-1", name: "Checking", initialBalance: 100000 }],
      events: [
        {
          id: "e1",
          description: "Big expense",
          amount: -90000,
          type: "EXPENSE",
          costType: "RECURRENT",
          status: "PLANNED",
          priority: "IMPORTANT" as const,
          date: utcDate(2024, 1, 2),
          accountId: "acc-1",
        },
      ],
      startDate: utcDate(2024, 1, 1),
      endDate: utcDate(2024, 1, 5),
      safetyBuffer: 20000, // $200 safety buffer
    };

    const result = buildCashflowProjection(input);

    // Balance goes to $100, which is below $200 buffer but not negative
    expect(result.days[1].endingBalance).toBe(10000);
    expect(result.days[1].isCritical).toBe(true);
    expect(result.days[1].isNegative).toBe(false);
    expect(result.criticalDays).toBe(4); // Days 2, 3, 4, 5
  });

  it("should apply confirmed events before start date to initial balance", () => {
    const input: CashflowInput = {
      accounts: [{ id: "acc-1", name: "Checking", initialBalance: 100000 }],
      events: [
        {
          id: "e1",
          description: "Past expense",
          amount: -30000,
          type: "EXPENSE",
          costType: "RECURRENT",
          status: "CONFIRMED",
          priority: "IMPORTANT" as const,
          date: utcDate(2023, 12, 15), // Before start date
          accountId: "acc-1",
        },
      ],
      startDate: utcDate(2024, 1, 1),
      endDate: utcDate(2024, 1, 5),
    };

    const result = buildCashflowProjection(input);

    // Starting balance should reflect the past confirmed expense
    expect(result.days[0].startingBalance).toBe(70000);
  });

  it("should handle multiple events on the same day", () => {
    const input: CashflowInput = {
      ...baseInput,
      events: [
        {
          id: "e1",
          description: "Salary",
          amount: 500000,
          type: "INCOME",
          costType: null,
          status: "CONFIRMED",
          priority: "IMPORTANT" as const,
          date: utcDate(2024, 1, 1),
          accountId: "acc-1",
        },
        {
          id: "e2",
          description: "Rent",
          amount: -150000,
          type: "EXPENSE",
          costType: "RECURRENT",
          status: "CONFIRMED",
          priority: "IMPORTANT" as const,
          date: utcDate(2024, 1, 1),
          accountId: "acc-1",
        },
        {
          id: "e3",
          description: "Groceries",
          amount: -10000,
          type: "EXPENSE",
          costType: "RECURRENT",
          status: "CONFIRMED",
          priority: "IMPORTANT" as const,
          date: utcDate(2024, 1, 1),
          accountId: "acc-1",
        },
      ],
    };

    const result = buildCashflowProjection(input);

    expect(result.days[0].events).toHaveLength(3);
    expect(result.days[0].netChange).toBe(340000); // 500k - 150k - 10k
    expect(result.days[0].endingBalance).toBe(440000);
  });

  it("should handle multiple accounts", () => {
    const input: CashflowInput = {
      accounts: [
        { id: "checking", name: "Checking", initialBalance: 100000 },
        { id: "savings", name: "Savings", initialBalance: 500000 },
      ],
      events: [
        {
          id: "e1",
          description: "Expense from checking",
          amount: -20000,
          type: "EXPENSE",
          costType: "RECURRENT",
          status: "CONFIRMED",
          priority: "IMPORTANT" as const,
          date: utcDate(2024, 1, 2),
          accountId: "checking",
        },
      ],
      startDate: utcDate(2024, 1, 1),
      endDate: utcDate(2024, 1, 3),
    };

    const result = buildCashflowProjection(input);

    // Total starting balance: $1000 + $5000 = $6000
    expect(result.days[0].startingBalance).toBe(600000);
    expect(result.days[2].endingBalance).toBe(580000);
  });
});

describe("getAccountBalances", () => {
  it("should calculate balances at a specific date", () => {
    const accounts = [
      { id: "acc-1", name: "Checking", initialBalance: 100000 },
      { id: "acc-2", name: "Savings", initialBalance: 500000 },
    ];
    const events = [
      {
        id: "e1",
        description: "Expense",
        amount: -20000,
        type: "EXPENSE" as const,
        costType: "RECURRENT" as const,
        status: "CONFIRMED" as const,
        priority: "IMPORTANT" as const,
        date: utcDate(2024, 1, 5),
        accountId: "acc-1",
      },
      {
        id: "e2",
        description: "Deposit",
        amount: 30000,
        type: "INCOME" as const,
        costType: null,
        status: "CONFIRMED" as const,
        priority: "IMPORTANT" as const,
        date: utcDate(2024, 1, 10),
        accountId: "acc-2",
      },
    ];

    // As of Jan 7 (includes first event but not second)
    const balances = getAccountBalances(accounts, events, utcDate(2024, 1, 7));

    expect(balances.get("acc-1")).toBe(80000);
    expect(balances.get("acc-2")).toBe(500000);
  });

  it("should ignore PLANNED events", () => {
    const accounts = [{ id: "acc-1", name: "Checking", initialBalance: 100000 }];
    const events = [
      {
        id: "e1",
        description: "Planned expense",
        amount: -50000,
        type: "EXPENSE" as const,
        costType: "RECURRENT" as const,
        status: "PLANNED" as const,
        priority: "IMPORTANT" as const,
        date: utcDate(2024, 1, 5),
        accountId: "acc-1",
      },
    ];

    const balances = getAccountBalances(accounts, events, utcDate(2024, 1, 10));

    expect(balances.get("acc-1")).toBe(100000); // Not affected by planned event
  });
});

describe("getCurrentBalance", () => {
  it("should return total balance across all accounts", () => {
    const accounts = [
      { id: "acc-1", name: "Checking", initialBalance: 100000 },
      { id: "acc-2", name: "Savings", initialBalance: 500000 },
    ];
    const events = [
      {
        id: "e1",
        description: "Expense",
        amount: -20000,
        type: "EXPENSE" as const,
        costType: "RECURRENT" as const,
        status: "CONFIRMED" as const,
        priority: "IMPORTANT" as const,
        date: utcDate(2024, 1, 1),
        accountId: "acc-1",
      },
    ];

    const total = getCurrentBalance(accounts, events, utcDate(2024, 1, 5));

    expect(total).toBe(580000); // 80000 + 500000
  });
});

describe("findCriticalEvents", () => {
  it("should identify events that cause balance to go negative", () => {
    const input: CashflowInput = {
      accounts: [{ id: "acc-1", name: "Checking", initialBalance: 10000 }],
      events: [
        {
          id: "e1",
          description: "Small expense",
          amount: -5000,
          type: "EXPENSE",
          costType: "RECURRENT",
          status: "PLANNED",
          priority: "IMPORTANT" as const,
          date: utcDate(2024, 1, 2),
          accountId: "acc-1",
        },
        {
          id: "e2",
          description: "Big expense",
          amount: -20000,
          type: "EXPENSE",
          costType: "EXCEPTIONAL",
          status: "PLANNED",
          priority: "IMPORTANT" as const,
          date: utcDate(2024, 1, 3),
          accountId: "acc-1",
        },
      ],
      startDate: utcDate(2024, 1, 1),
      endDate: utcDate(2024, 1, 5),
    };

    const projection = buildCashflowProjection(input);
    const criticalEvents = findCriticalEvents(projection);

    expect(criticalEvents).toHaveLength(1);
    expect(criticalEvents[0].id).toBe("e2");
    expect(criticalEvents[0].description).toBe("Big expense");
  });
});

describe("getProjectionSummary", () => {
  it("should calculate correct summary statistics", () => {
    const input: CashflowInput = {
      accounts: [{ id: "acc-1", name: "Checking", initialBalance: 100000 }],
      events: [
        {
          id: "e1",
          description: "Income",
          amount: 200000,
          type: "INCOME",
          costType: null,
          status: "CONFIRMED",
          priority: "IMPORTANT" as const,
          date: utcDate(2024, 1, 1),
          accountId: "acc-1",
        },
        {
          id: "e2",
          description: "Expense 1",
          amount: -50000,
          type: "EXPENSE",
          costType: "RECURRENT",
          status: "PLANNED",
          priority: "IMPORTANT" as const,
          date: utcDate(2024, 1, 2),
          accountId: "acc-1",
        },
        {
          id: "e3",
          description: "Expense 2",
          amount: -50000,
          type: "EXPENSE",
          costType: "RECURRENT",
          status: "PLANNED",
          priority: "IMPORTANT" as const,
          date: utcDate(2024, 1, 4),
          accountId: "acc-1",
        },
      ],
      startDate: utcDate(2024, 1, 1),
      endDate: utcDate(2024, 1, 5),
    };

    const projection = buildCashflowProjection(input);
    const summary = getProjectionSummary(projection);

    expect(summary.startingBalance).toBe(100000);
    expect(summary.endingBalance).toBe(200000);
    expect(summary.netChange).toBe(100000);
    expect(summary.daysUntilNegative).toBeNull();
  });

  it("should find days until negative", () => {
    const input: CashflowInput = {
      accounts: [{ id: "acc-1", name: "Checking", initialBalance: 10000 }],
      events: [
        {
          id: "e1",
          description: "Big expense",
          amount: -50000,
          type: "EXPENSE",
          costType: "EXCEPTIONAL",
          status: "PLANNED",
          priority: "IMPORTANT" as const,
          date: utcDate(2024, 1, 3),
          accountId: "acc-1",
        },
      ],
      startDate: utcDate(2024, 1, 1),
      endDate: utcDate(2024, 1, 5),
    };

    const projection = buildCashflowProjection(input);
    const summary = getProjectionSummary(projection);

    expect(summary.daysUntilNegative).toBe(2); // Day 0 is Jan 1, Day 2 is Jan 3
  });
});

describe("determinism", () => {
  it("should produce identical results for same inputs", () => {
    const input: CashflowInput = {
      accounts: [
        { id: "acc-1", name: "Checking", initialBalance: 100000 },
        { id: "acc-2", name: "Savings", initialBalance: 500000 },
      ],
      events: [
        {
          id: "e1",
          description: "Income",
          amount: 500000,
          type: "INCOME",
          costType: null,
          status: "CONFIRMED",
          priority: "IMPORTANT" as const,
          date: utcDate(2024, 1, 1),
          accountId: "acc-1",
        },
        {
          id: "e2",
          description: "Rent",
          amount: -150000,
          type: "EXPENSE",
          costType: "RECURRENT",
          status: "PLANNED",
          priority: "IMPORTANT" as const,
          date: utcDate(2024, 1, 5),
          accountId: "acc-1",
        },
      ],
      startDate: utcDate(2024, 1, 1),
      endDate: utcDate(2024, 1, 10),
    };

    const result1 = buildCashflowProjection(input);
    const result2 = buildCashflowProjection(input);

    expect(result1.days.length).toBe(result2.days.length);
    expect(result1.totalIncome).toBe(result2.totalIncome);
    expect(result1.totalExpenses).toBe(result2.totalExpenses);
    expect(result1.lowestBalance).toBe(result2.lowestBalance);

    for (let i = 0; i < result1.days.length; i++) {
      expect(result1.days[i].endingBalance).toBe(result2.days[i].endingBalance);
    }
  });
});
