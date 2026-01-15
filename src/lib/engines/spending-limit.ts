import type {
  Cents,
  SpendingLimitBreakdown,
  SpendingLimitInput,
  HorizonMode,
} from "@/types/finance";
import { startOfDay, endOfMonth, daysBetween } from "@/types/finance";

// ============================================
// TYPES
// ============================================

export interface SpendingLimitResult {
  breakdown: SpendingLimitBreakdown;
  explanation: string;
  warnings: string[];
}

// ============================================
// CORE FUNCTIONS
// ============================================

/**
 * Calculate the daily spending limit
 *
 * Formula:
 * DailySpendLimit = (CashNow - RequiredFutureExpenses - PlannedInvestments - SafetyBuffer) / DaysUntilHorizon
 *
 * This function is deterministic and testable.
 */
export function calculateDailySpendingLimit(
  input: SpendingLimitInput
): SpendingLimitResult {
  const {
    currentBalance,
    events,
    horizonDate,
    horizonMode,
    safetyBuffer,
    today = new Date(),
  } = input;

  const todayStart = startOfDay(today);
  const horizonStart = startOfDay(horizonDate);

  // Calculate days until horizon (at least 1 to avoid division by zero)
  const daysUntilHorizon = Math.max(1, daysBetween(todayStart, horizonStart) - 1);

  // Filter events within the horizon
  // - Income on today: included (money available for planning)
  // - Expenses on today: excluded (assumed already handled in currentBalance)
  // - Investments on today: included (transfer may not have happened yet)
  const futureEvents = events.filter((e) => {
    const eventDate = startOfDay(e.date);
    const isOnOrAfterToday = eventDate.getTime() >= todayStart.getTime();
    const isAfterToday = eventDate.getTime() > todayStart.getTime();
    const isWithinHorizon = eventDate.getTime() <= horizonStart.getTime();
    const isPlanned = e.status === "PLANNED";

    // Expenses only count from tomorrow (today's expenses affect currentBalance)
    if (e.type === "EXPENSE") {
      return isAfterToday && isWithinHorizon && isPlanned;
    }
    // Income and investments count from today
    return isOnOrAfterToday && isWithinHorizon && isPlanned;
  });

  // Sum up required expenses (negative amounts, EXPENSE type)
  const requiredExpenses = futureEvents
    .filter((e) => e.type === "EXPENSE" && e.amount < 0)
    .reduce((sum, e) => sum + Math.abs(e.amount), 0);

  // Sum up planned investments (negative amounts, INVESTMENT type)
  const plannedInvestments = futureEvents
    .filter((e) => e.type === "INVESTMENT" && e.amount < 0)
    .reduce((sum, e) => sum + Math.abs(e.amount), 0);

  // Add future income to available cash (positive amounts)
  const futureIncome = futureEvents
    .filter((e) => e.type === "INCOME" && e.amount > 0)
    .reduce((sum, e) => sum + e.amount, 0);

  // Available cash includes current balance + future income
  const effectiveCash = currentBalance + futureIncome;

  // Calculate available for discretionary spending
  const availableForSpending =
    effectiveCash - requiredExpenses - plannedInvestments - safetyBuffer;

  // Calculate daily limit
  const dailyLimit = Math.floor(availableForSpending / daysUntilHorizon);

  // Determine if negative and why
  const isNegative = availableForSpending < 0;
  let shortfallReason: SpendingLimitBreakdown["shortfallReason"];

  if (isNegative) {
    // Determine what's causing the shortfall
    const shortfallFromExpenses = effectiveCash - requiredExpenses < 0;
    const shortfallFromInvestments =
      effectiveCash - requiredExpenses - plannedInvestments < 0 && !shortfallFromExpenses;
    const shortfallFromBuffer =
      effectiveCash - requiredExpenses - plannedInvestments - safetyBuffer < 0 &&
      !shortfallFromExpenses &&
      !shortfallFromInvestments;

    if (shortfallFromExpenses && shortfallFromInvestments && shortfallFromBuffer) {
      shortfallReason = "multiple";
    } else if (shortfallFromExpenses) {
      shortfallReason = "expenses";
    } else if (shortfallFromInvestments) {
      shortfallReason = "investments";
    } else if (shortfallFromBuffer) {
      shortfallReason = "buffer";
    } else {
      shortfallReason = "multiple";
    }
  }

  const breakdown: SpendingLimitBreakdown = {
    cashNow: effectiveCash,
    requiredExpenses,
    plannedInvestments,
    safetyBuffer,
    availableForSpending,
    daysUntilHorizon,
    dailyLimit,
    horizonDate,
    horizonMode,
    isNegative,
    shortfallReason,
  };

  // Build explanation
  const explanation = buildExplanation(breakdown);
  const warnings = buildWarnings(breakdown, input);

  return { breakdown, explanation, warnings };
}

/**
 * Find the next income event date for NEXT_INCOME horizon mode
 */
export function findNextIncomeDate(
  events: SpendingLimitInput["events"],
  from: Date = new Date()
): Date | null {
  const fromStart = startOfDay(from);

  const incomeEvents = events
    .filter(
      (e) =>
        e.type === "INCOME" &&
        e.amount > 0 &&
        startOfDay(e.date).getTime() > fromStart.getTime()
    )
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  return incomeEvents.length > 0 ? incomeEvents[0].date : null;
}

/**
 * Get the horizon date based on mode
 */
export function getHorizonDate(
  mode: HorizonMode,
  events: SpendingLimitInput["events"],
  today: Date = new Date()
): Date {
  if (mode === "NEXT_INCOME") {
    const nextIncome = findNextIncomeDate(events, today);
    // If no income found, fall back to end of month
    return nextIncome || endOfMonth(today);
  }

  // END_OF_MONTH mode
  return endOfMonth(today);
}

/**
 * Build a human-readable explanation of the calculation
 */
function buildExplanation(breakdown: SpendingLimitBreakdown): string {
  const {
    cashNow,
    requiredExpenses,
    plannedInvestments,
    safetyBuffer,
    availableForSpending,
    daysUntilHorizon,
    dailyLimit,
    isNegative,
    shortfallReason,
  } = breakdown;

  const lines: string[] = [];

  lines.push(`Current cash: $${(cashNow / 100).toFixed(2)}`);
  lines.push(`Required expenses: -$${(requiredExpenses / 100).toFixed(2)}`);
  lines.push(`Planned investments: -$${(plannedInvestments / 100).toFixed(2)}`);
  lines.push(`Safety buffer: -$${(safetyBuffer / 100).toFixed(2)}`);
  lines.push(`---`);
  lines.push(`Available for spending: $${(availableForSpending / 100).toFixed(2)}`);
  lines.push(`Days until horizon: ${daysUntilHorizon}`);
  lines.push(`---`);

  if (isNegative) {
    lines.push(`Daily limit: $0 (SHORTFALL)`);
    switch (shortfallReason) {
      case "expenses":
        lines.push(`Reason: Your required expenses exceed your available cash.`);
        break;
      case "investments":
        lines.push(
          `Reason: Your planned investments exceed what's left after expenses.`
        );
        break;
      case "buffer":
        lines.push(
          `Reason: After expenses and investments, you can't maintain your safety buffer.`
        );
        break;
      case "multiple":
        lines.push(`Reason: Multiple factors are causing the shortfall.`);
        break;
    }
  } else {
    lines.push(`Daily spending limit: $${(dailyLimit / 100).toFixed(2)}`);
  }

  return lines.join("\n");
}

/**
 * Build warnings based on the calculation
 */
function buildWarnings(
  breakdown: SpendingLimitBreakdown,
  input: SpendingLimitInput
): string[] {
  const warnings: string[] = [];

  if (breakdown.isNegative) {
    warnings.push(
      "Your daily spending limit is negative. Review your upcoming expenses and investments."
    );
  }

  if (breakdown.dailyLimit > 0 && breakdown.dailyLimit < 1000) {
    // Less than $10/day
    warnings.push(
      "Your daily spending limit is very tight. Consider reducing expenses or postponing investments."
    );
  }

  if (breakdown.daysUntilHorizon < 3) {
    warnings.push(
      "Your horizon is very close. The daily limit may not be representative of your typical spending capacity."
    );
  }

  // Check if there are large single expenses that dominate
  const largeExpenses = input.events.filter(
    (e) =>
      e.type === "EXPENSE" &&
      e.amount < 0 &&
      Math.abs(e.amount) > breakdown.cashNow * 0.3
  );

  if (largeExpenses.length > 0) {
    warnings.push(
      "You have large upcoming expenses that significantly impact your spending limit."
    );
  }

  return warnings;
}

/**
 * Calculate spending limit with automatic horizon detection
 */
export function calculateSpendingLimitAuto(
  currentBalance: Cents,
  events: SpendingLimitInput["events"],
  horizonMode: HorizonMode,
  safetyBuffer: Cents,
  today: Date = new Date()
): SpendingLimitResult {
  const horizonDate = getHorizonDate(horizonMode, events, today);

  return calculateDailySpendingLimit({
    currentBalance,
    events,
    horizonDate,
    horizonMode,
    safetyBuffer,
    today,
  });
}
