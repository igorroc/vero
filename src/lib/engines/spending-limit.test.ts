import { describe, it, expect } from "vitest";
import {
  calculateDailySpendingLimit,
  findNextIncomeDate,
  findLastPlannedExpenseDate,
  getHorizonDate,
  calculateSpendingLimitAuto,
} from "./spending-limit";
import type { SpendingLimitInput } from "@/types/finance";

// Helper to create dates in UTC
function utcDate(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day));
}

describe("calculateDailySpendingLimit", () => {
  const baseInput: SpendingLimitInput = {
    currentBalance: 100000, // $1000
    events: [],
    horizonDate: utcDate(2024, 1, 31),
    horizonMode: "END_OF_MONTH",
    safetyBuffer: 10000, // $100
    today: utcDate(2024, 1, 1),
  };

  it("should calculate basic daily limit correctly", () => {
    const result = calculateDailySpendingLimit(baseInput);

    // Available: $1000 - $100 buffer = $900
    // Days: Jan 1 to Jan 31 = 30 days (excluding day 1)
    // Daily: $900 / 30 = $30
    expect(result.breakdown.availableForSpending).toBe(90000);
    expect(result.breakdown.daysUntilHorizon).toBe(30);
    expect(result.breakdown.dailyLimit).toBe(3000);
    expect(result.breakdown.isNegative).toBe(false);
  });

  it("should subtract required expenses from available cash", () => {
    const input: SpendingLimitInput = {
      ...baseInput,
      events: [
        {
          amount: -30000, // -$300 rent
          type: "EXPENSE",
          status: "PLANNED",
          priority: "IMPORTANT" as const,
          date: utcDate(2024, 1, 5),
        },
        {
          amount: -10000, // -$100 utilities
          type: "EXPENSE",
          status: "PLANNED",
          priority: "IMPORTANT" as const,
          date: utcDate(2024, 1, 15),
        },
      ],
    };

    const result = calculateDailySpendingLimit(input);

    // Available: $1000 - $300 - $100 - $100 buffer = $500
    expect(result.breakdown.requiredExpenses).toBe(40000);
    expect(result.breakdown.availableForSpending).toBe(50000);
  });

  it("should subtract planned investments", () => {
    const input: SpendingLimitInput = {
      ...baseInput,
      events: [
        {
          amount: -20000, // -$200 investment
          type: "INVESTMENT",
          status: "PLANNED",
          priority: "IMPORTANT" as const,
          date: utcDate(2024, 1, 10),
        },
      ],
    };

    const result = calculateDailySpendingLimit(input);

    // Available: $1000 - $200 investment - $100 buffer = $700
    expect(result.breakdown.plannedInvestments).toBe(20000);
    expect(result.breakdown.availableForSpending).toBe(70000);
  });

  it("should include future income in available cash", () => {
    const input: SpendingLimitInput = {
      ...baseInput,
      currentBalance: 50000, // $500
      events: [
        {
          amount: 300000, // +$3000 salary
          type: "INCOME",
          status: "PLANNED",
          priority: "IMPORTANT" as const,
          date: utcDate(2024, 1, 15),
        },
      ],
    };

    const result = calculateDailySpendingLimit(input);

    // Cash: $500 + $3000 income = $3500
    // Available: $3500 - $100 buffer = $3400
    expect(result.breakdown.cashNow).toBe(350000);
    expect(result.breakdown.availableForSpending).toBe(340000);
  });

  it("should ignore CONFIRMED events (only count PLANNED)", () => {
    const input: SpendingLimitInput = {
      ...baseInput,
      events: [
        {
          amount: -30000, // Already paid
          type: "EXPENSE",
          status: "CONFIRMED",
          priority: "IMPORTANT" as const,
          date: utcDate(2024, 1, 5),
        },
        {
          amount: -10000, // Planned
          type: "EXPENSE",
          status: "PLANNED",
          priority: "IMPORTANT" as const,
          date: utcDate(2024, 1, 15),
        },
      ],
    };

    const result = calculateDailySpendingLimit(input);

    // Only the planned expense should count
    expect(result.breakdown.requiredExpenses).toBe(10000);
  });

  it("should ignore events outside the horizon", () => {
    const input: SpendingLimitInput = {
      ...baseInput,
      events: [
        {
          amount: -50000,
          type: "EXPENSE",
          status: "PLANNED",
          priority: "IMPORTANT" as const,
          date: utcDate(2024, 2, 15), // After Jan 31
        },
      ],
    };

    const result = calculateDailySpendingLimit(input);

    expect(result.breakdown.requiredExpenses).toBe(0);
  });

  it("should handle negative spending limit", () => {
    const input: SpendingLimitInput = {
      ...baseInput,
      currentBalance: 50000, // $500
      events: [
        {
          amount: -100000, // -$1000 rent
          type: "EXPENSE",
          status: "PLANNED",
          priority: "IMPORTANT" as const,
          date: utcDate(2024, 1, 5),
        },
      ],
    };

    const result = calculateDailySpendingLimit(input);

    expect(result.breakdown.isNegative).toBe(true);
    expect(result.breakdown.shortfallReason).toBe("expenses");
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it("should identify investment shortfall", () => {
    const input: SpendingLimitInput = {
      ...baseInput,
      currentBalance: 50000, // $500
      events: [
        {
          amount: -20000, // -$200 expense (leaves $300)
          type: "EXPENSE",
          status: "PLANNED",
          priority: "IMPORTANT" as const,
          date: utcDate(2024, 1, 5),
        },
        {
          amount: -40000, // -$400 investment (causes shortfall)
          type: "INVESTMENT",
          status: "PLANNED",
          priority: "IMPORTANT" as const,
          date: utcDate(2024, 1, 10),
        },
      ],
    };

    const result = calculateDailySpendingLimit(input);

    // $500 - $200 - $400 - $100 buffer = -$200
    expect(result.breakdown.isNegative).toBe(true);
    expect(result.breakdown.shortfallReason).toBe("investments");
  });

  it("should identify buffer shortfall", () => {
    const input: SpendingLimitInput = {
      ...baseInput,
      currentBalance: 15000, // $150
      safetyBuffer: 20000, // $200 buffer (more than available)
      events: [],
    };

    const result = calculateDailySpendingLimit(input);

    // $150 - $200 buffer = -$50
    expect(result.breakdown.isNegative).toBe(true);
    expect(result.breakdown.shortfallReason).toBe("buffer");
  });

  it("should avoid division by zero", () => {
    const input: SpendingLimitInput = {
      ...baseInput,
      today: utcDate(2024, 1, 31), // Same as horizon
      horizonDate: utcDate(2024, 1, 31),
    };

    const result = calculateDailySpendingLimit(input);

    expect(result.breakdown.daysUntilHorizon).toBe(1); // Minimum 1
    expect(Number.isFinite(result.breakdown.dailyLimit)).toBe(true);
  });

  it("should generate explanation string", () => {
    const result = calculateDailySpendingLimit(baseInput);

    expect(result.explanation).toContain("Current cash");
    expect(result.explanation).toContain("Required expenses");
    expect(result.explanation).toContain("Daily spending limit");
  });

  it("should be deterministic", () => {
    const result1 = calculateDailySpendingLimit(baseInput);
    const result2 = calculateDailySpendingLimit(baseInput);

    expect(result1.breakdown.dailyLimit).toBe(result2.breakdown.dailyLimit);
    expect(result1.breakdown.availableForSpending).toBe(
      result2.breakdown.availableForSpending
    );
  });
});

describe("findNextIncomeDate", () => {
  it("should find the next income event", () => {
    const events = [
      {
        amount: 500000,
        type: "INCOME" as const,
        status: "PLANNED" as const,
        priority: "IMPORTANT" as const,
        date: utcDate(2024, 1, 15),
      },
      {
        amount: 500000,
        type: "INCOME" as const,
        status: "PLANNED" as const,
        priority: "IMPORTANT" as const,
        date: utcDate(2024, 2, 15),
      },
    ];

    const result = findNextIncomeDate(events, utcDate(2024, 1, 1));

    expect(result?.toISOString().split("T")[0]).toBe("2024-01-15");
  });

  it("should return null if no future income", () => {
    const events = [
      {
        amount: 500000,
        type: "INCOME" as const,
        status: "CONFIRMED" as const,
        priority: "IMPORTANT" as const,
        date: utcDate(2023, 12, 15), // Past
      },
    ];

    const result = findNextIncomeDate(events, utcDate(2024, 1, 1));

    expect(result).toBeNull();
  });

  it("should ignore past income events", () => {
    const events = [
      {
        amount: 500000,
        type: "INCOME" as const,
        status: "PLANNED" as const,
        priority: "IMPORTANT" as const,
        date: utcDate(2023, 12, 15), // Past
      },
      {
        amount: 500000,
        type: "INCOME" as const,
        status: "PLANNED" as const,
        priority: "IMPORTANT" as const,
        date: utcDate(2024, 2, 15), // Future
      },
    ];

    const result = findNextIncomeDate(events, utcDate(2024, 1, 1));

    expect(result?.toISOString().split("T")[0]).toBe("2024-02-15");
  });
});

describe("findLastPlannedExpenseDate", () => {
  it("should find the last planned expense date", () => {
    const events = [
      {
        amount: -30000,
        type: "EXPENSE" as const,
        status: "PLANNED" as const,
        priority: "IMPORTANT" as const,
        date: utcDate(2024, 1, 15),
      },
      {
        amount: -50000,
        type: "EXPENSE" as const,
        status: "PLANNED" as const,
        priority: "IMPORTANT" as const,
        date: utcDate(2024, 2, 20), // Latest
      },
      {
        amount: -20000,
        type: "EXPENSE" as const,
        status: "PLANNED" as const,
        priority: "IMPORTANT" as const,
        date: utcDate(2024, 2, 10),
      },
    ];

    const result = findLastPlannedExpenseDate(events, utcDate(2024, 1, 1));

    expect(result?.toISOString().split("T")[0]).toBe("2024-02-20");
  });

  it("should include investments as expenses", () => {
    const events = [
      {
        amount: -30000,
        type: "EXPENSE" as const,
        status: "PLANNED" as const,
        priority: "IMPORTANT" as const,
        date: utcDate(2024, 1, 15),
      },
      {
        amount: -50000,
        type: "INVESTMENT" as const,
        status: "PLANNED" as const,
        priority: "IMPORTANT" as const,
        date: utcDate(2024, 3, 1), // Latest
      },
    ];

    const result = findLastPlannedExpenseDate(events, utcDate(2024, 1, 1));

    expect(result?.toISOString().split("T")[0]).toBe("2024-03-01");
  });

  it("should ignore CONFIRMED expenses", () => {
    const events = [
      {
        amount: -30000,
        type: "EXPENSE" as const,
        status: "CONFIRMED" as const, // Should be ignored
        priority: "IMPORTANT" as const,
        date: utcDate(2024, 3, 15),
      },
      {
        amount: -20000,
        type: "EXPENSE" as const,
        status: "PLANNED" as const,
        priority: "IMPORTANT" as const,
        date: utcDate(2024, 2, 10),
      },
    ];

    const result = findLastPlannedExpenseDate(events, utcDate(2024, 1, 1));

    expect(result?.toISOString().split("T")[0]).toBe("2024-02-10");
  });

  it("should return null if no planned expenses", () => {
    const result = findLastPlannedExpenseDate([], utcDate(2024, 1, 1));
    expect(result).toBeNull();
  });
});

describe("getHorizonDate", () => {
  it("should return end of month for END_OF_MONTH mode", () => {
    const result = getHorizonDate("END_OF_MONTH", [], utcDate(2024, 1, 15));

    expect(result.toISOString().split("T")[0]).toBe("2024-01-31");
  });

  it("should return next income date for NEXT_INCOME mode", () => {
    const events = [
      {
        amount: 500000,
        type: "INCOME" as const,
        status: "PLANNED" as const,
        priority: "IMPORTANT" as const,
        date: utcDate(2024, 1, 25),
      },
    ];

    const result = getHorizonDate("NEXT_INCOME", events, utcDate(2024, 1, 10));

    expect(result.toISOString().split("T")[0]).toBe("2024-01-25");
  });

  it("should fall back to end of month if no income in NEXT_INCOME mode", () => {
    const result = getHorizonDate("NEXT_INCOME", [], utcDate(2024, 1, 15));

    expect(result.toISOString().split("T")[0]).toBe("2024-01-31");
  });

  it("should extend horizon to include future expenses beyond base horizon", () => {
    // User scenario: has expense next month but no income
    const events = [
      {
        amount: -11000, // R$110 expense next month
        type: "EXPENSE" as const,
        status: "PLANNED" as const,
        priority: "IMPORTANT" as const,
        date: utcDate(2024, 2, 15), // Feb 15 (next month)
      },
    ];

    // Today is Jan 15, end of month is Jan 31, but expense is Feb 15
    const result = getHorizonDate("END_OF_MONTH", events, utcDate(2024, 1, 15));

    // Horizon should be extended to Feb 15 to include the expense
    expect(result.toISOString().split("T")[0]).toBe("2024-02-15");
  });

  it("should not extend horizon if no expenses beyond base horizon", () => {
    const events = [
      {
        amount: -11000,
        type: "EXPENSE" as const,
        status: "PLANNED" as const,
        priority: "IMPORTANT" as const,
        date: utcDate(2024, 1, 20), // Before end of month
      },
    ];

    const result = getHorizonDate("END_OF_MONTH", events, utcDate(2024, 1, 15));

    // Horizon stays at end of month
    expect(result.toISOString().split("T")[0]).toBe("2024-01-31");
  });
});

describe("calculateSpendingLimitAuto", () => {
  it("should consider future expenses even if beyond normal horizon", () => {
    // User scenario: R$100 balance, R$110 expense next month, no income
    // The user should NOT be able to spend any money
    const events = [
      {
        amount: -11000, // R$110 expense next month
        type: "EXPENSE" as const,
        status: "PLANNED" as const,
        priority: "IMPORTANT" as const,
        date: utcDate(2024, 2, 15), // Feb 15
      },
    ];

    const result = calculateSpendingLimitAuto(
      10000, // R$100 balance
      events,
      "END_OF_MONTH",
      0, // No safety buffer for simplicity
      utcDate(2024, 1, 15) // Today is Jan 15
    );

    // Available: R$100 - R$110 = -R$10
    // Daily limit should be negative (or zero)
    expect(result.breakdown.requiredExpenses).toBe(11000);
    expect(result.breakdown.availableForSpending).toBe(-1000); // -R$10
    expect(result.breakdown.isNegative).toBe(true);
    expect(result.breakdown.dailyLimit).toBeLessThanOrEqual(0);
  });

  it("should automatically determine horizon and calculate limit", () => {
    const events = [
      {
        amount: 500000,
        type: "INCOME" as const,
        status: "PLANNED" as const,
        priority: "IMPORTANT" as const,
        date: utcDate(2024, 1, 20),
      },
      {
        amount: -30000,
        type: "EXPENSE" as const,
        status: "PLANNED" as const,
        priority: "IMPORTANT" as const,
        date: utcDate(2024, 1, 5),
      },
    ];

    const result = calculateSpendingLimitAuto(
      100000, // $1000
      events,
      "NEXT_INCOME",
      10000, // $100 buffer
      utcDate(2024, 1, 1)
    );

    // Should use Jan 20 as horizon (next income)
    expect(result.breakdown.horizonDate.toISOString().split("T")[0]).toBe("2024-01-20");
    expect(result.breakdown.horizonMode).toBe("NEXT_INCOME");
  });
});

describe("complex scenarios", () => {
  it("should handle realistic monthly budget", () => {
    const events = [
      // Income on 1st
      {
        amount: 500000, // $5000 salary
        type: "INCOME" as const,
        status: "PLANNED" as const,
        priority: "IMPORTANT" as const,
        date: utcDate(2024, 2, 1),
      },
      // Fixed expenses
      {
        amount: -150000, // $1500 rent
        type: "EXPENSE" as const,
        status: "PLANNED" as const,
        priority: "IMPORTANT" as const,
        date: utcDate(2024, 2, 5),
      },
      {
        amount: -20000, // $200 utilities
        type: "EXPENSE" as const,
        status: "PLANNED" as const,
        priority: "IMPORTANT" as const,
        date: utcDate(2024, 2, 10),
      },
      {
        amount: -50000, // $500 car payment
        type: "EXPENSE" as const,
        status: "PLANNED" as const,
        priority: "IMPORTANT" as const,
        date: utcDate(2024, 2, 15),
      },
      // Investment
      {
        amount: -100000, // $1000 investment
        type: "INVESTMENT" as const,
        status: "PLANNED" as const,
        priority: "IMPORTANT" as const,
        date: utcDate(2024, 2, 1),
      },
    ];

    const result = calculateDailySpendingLimit({
      currentBalance: 50000, // $500 starting
      events,
      horizonDate: utcDate(2024, 2, 29), // End of Feb
      horizonMode: "END_OF_MONTH",
      safetyBuffer: 50000, // $500 safety
      today: utcDate(2024, 2, 1),
    });

    // Cash: $500 + $5000 income = $5500
    // Expenses: $1500 + $200 + $500 = $2200
    // Investments: $1000
    // Buffer: $500
    // Available: $5500 - $2200 - $1000 - $500 = $1800
    // Days: 28 (Feb 1 to Feb 29)
    // Daily: $1800 / 28 = ~$64.28

    expect(result.breakdown.cashNow).toBe(550000);
    expect(result.breakdown.requiredExpenses).toBe(220000);
    expect(result.breakdown.plannedInvestments).toBe(100000);
    expect(result.breakdown.availableForSpending).toBe(180000);
    expect(result.breakdown.dailyLimit).toBe(6428); // $64.28
    expect(result.breakdown.isNegative).toBe(false);
  });

  it("should warn about tight budget", () => {
    const result = calculateDailySpendingLimit({
      currentBalance: 15000, // $150
      events: [],
      horizonDate: utcDate(2024, 1, 31),
      horizonMode: "END_OF_MONTH",
      safetyBuffer: 5000, // $50
      today: utcDate(2024, 1, 1),
    });

    // $150 - $50 = $100 available / 30 days = ~$3.33/day
    expect(result.warnings.some((w) => w.includes("tight"))).toBe(true);
  });
});
