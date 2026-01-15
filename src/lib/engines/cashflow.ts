import type {
  Cents,
  CashflowDay,
  CashflowEvent,
  CashflowProjection,
  CashflowInput,
  PrioritySimulationResult,
  EventPriority,
} from "@/types/finance";
import { startOfDay, addDays, formatDateISO, daysBetween, formatCurrency } from "@/types/finance";

// ============================================
// TYPES
// ============================================

interface AccountState {
  id: string;
  name: string;
  balance: Cents;
}

// ============================================
// CORE FUNCTIONS
// ============================================

/**
 * Build a day-by-day cashflow projection
 *
 * This function is read-only and deterministic.
 * Given the same inputs, it produces the same outputs.
 *
 * Key behaviors:
 * - Only CONFIRMED events affect the starting balance
 * - PLANNED events are included in projections
 * - SKIPPED events are ignored entirely
 */
export function buildCashflowProjection(input: CashflowInput): CashflowProjection {
  const { accounts, events, startDate, endDate, safetyBuffer = 0 } = input;

  // Normalize dates
  const rangeStart = startOfDay(startDate);
  const rangeEnd = startOfDay(endDate);
  const numDays = daysBetween(rangeStart, rangeEnd);

  // Build account lookup
  const accountMap = new Map<string, AccountState>(
    accounts.map((acc) => [
      acc.id,
      { id: acc.id, name: acc.name, balance: acc.initialBalance },
    ])
  );

  // Group events by date (only include non-skipped events)
  const eventsByDate = groupEventsByDate(events.filter((e) => e.status !== "SKIPPED"));

  // Calculate confirmed events that occurred before the start date
  // These affect the starting balance
  const confirmedBeforeStart = events.filter(
    (e) =>
      e.status === "CONFIRMED" && startOfDay(e.date).getTime() < rangeStart.getTime()
  );

  // Apply confirmed events before start to account balances
  for (const event of confirmedBeforeStart) {
    const account = accountMap.get(event.accountId);
    if (account) {
      account.balance += event.amount;
    }
  }

  // Build day-by-day projection
  const days: CashflowDay[] = [];
  let runningBalance = getTotalBalance(accountMap);
  let lowestBalance = runningBalance;
  let lowestBalanceDate: Date | null = null;
  let totalIncome = 0;
  let totalExpenses = 0;
  let totalInvestments = 0;
  let negativeDays = 0;
  let criticalDays = 0;

  for (let i = 0; i < numDays; i++) {
    const currentDate = addDays(rangeStart, i);
    const dateKey = formatDateISO(currentDate);

    // Get events for this day
    const dayEvents = eventsByDate.get(dateKey) || [];

    // Calculate net change for the day
    let netChange = 0;
    const cashflowEvents: CashflowEvent[] = [];

    for (const event of dayEvents) {
      const account = accountMap.get(event.accountId);
      if (!account) continue;

      // Count the change (both PLANNED and CONFIRMED affect projection)
      netChange += event.amount;

      // Track totals by type
      if (event.amount > 0 && event.type === "INCOME") {
        totalIncome += event.amount;
      } else if (event.amount < 0) {
        if (event.type === "INVESTMENT") {
          totalInvestments += Math.abs(event.amount);
        } else {
          totalExpenses += Math.abs(event.amount);
        }
      }

      cashflowEvents.push({
        id: event.id,
        description: event.description,
        amount: event.amount,
        type: event.type,
        costType: event.costType,
        status: event.status,
        priority: event.priority,
        accountId: event.accountId,
        accountName: account.name,
      });
    }

    const startingBalance = runningBalance;
    const endingBalance = startingBalance + netChange;
    runningBalance = endingBalance;

    // Track lowest balance
    if (endingBalance < lowestBalance) {
      lowestBalance = endingBalance;
      lowestBalanceDate = currentDate;
    }

    // Track negative and critical days
    const isNegative = endingBalance < 0;
    const isCritical = endingBalance < safetyBuffer && endingBalance >= 0;

    if (isNegative) negativeDays++;
    if (isCritical) criticalDays++;

    days.push({
      date: currentDate,
      dateKey,
      startingBalance,
      events: cashflowEvents,
      netChange,
      endingBalance,
      isNegative,
      isCritical,
    });
  }

  return {
    startDate: rangeStart,
    endDate: rangeEnd,
    days,
    totalIncome,
    totalExpenses,
    totalInvestments,
    netChange: totalIncome - totalExpenses - totalInvestments,
    lowestBalance,
    lowestBalanceDate,
    negativeDays,
    criticalDays,
  };
}

/**
 * Group events by their date (YYYY-MM-DD key)
 */
function groupEventsByDate(
  events: CashflowInput["events"]
): Map<string, CashflowInput["events"]> {
  const map = new Map<string, CashflowInput["events"]>();

  for (const event of events) {
    const dateKey = formatDateISO(startOfDay(event.date));
    const existing = map.get(dateKey) || [];
    existing.push(event);
    map.set(dateKey, existing);
  }

  return map;
}

/**
 * Calculate total balance across all accounts
 */
function getTotalBalance(accountMap: Map<string, AccountState>): Cents {
  let total = 0;
  for (const account of accountMap.values()) {
    total += account.balance;
  }
  return total;
}

/**
 * Get account balances at a specific point in time
 */
export function getAccountBalances(
  accounts: CashflowInput["accounts"],
  events: CashflowInput["events"],
  asOfDate: Date
): Map<string, Cents> {
  const balances = new Map<string, Cents>();
  const targetDate = startOfDay(asOfDate);

  // Initialize with initial balances
  for (const account of accounts) {
    balances.set(account.id, account.initialBalance);
  }

  // Apply confirmed events up to the target date
  for (const event of events) {
    if (
      event.status === "CONFIRMED" &&
      startOfDay(event.date).getTime() <= targetDate.getTime()
    ) {
      const current = balances.get(event.accountId) || 0;
      balances.set(event.accountId, current + event.amount);
    }
  }

  return balances;
}

/**
 * Get total current balance (confirmed events only)
 */
export function getCurrentBalance(
  accounts: CashflowInput["accounts"],
  events: CashflowInput["events"],
  asOfDate: Date = new Date()
): Cents {
  const balances = getAccountBalances(accounts, events, asOfDate);
  let total = 0;
  for (const balance of balances.values()) {
    total += balance;
  }
  return total;
}

/**
 * Find critical events in the projection (events causing negative balance)
 */
export function findCriticalEvents(projection: CashflowProjection): CashflowEvent[] {
  const criticalEvents: CashflowEvent[] = [];

  for (const day of projection.days) {
    if (day.isNegative && day.startingBalance >= 0) {
      // This day transitions from positive to negative
      // Find the event(s) that caused it
      let runningBalance = day.startingBalance;
      for (const event of day.events) {
        runningBalance += event.amount;
        if (runningBalance < 0) {
          criticalEvents.push(event);
        }
      }
    }
  }

  return criticalEvents;
}

/**
 * Get summary statistics for a projection
 */
export function getProjectionSummary(projection: CashflowProjection): {
  startingBalance: Cents;
  endingBalance: Cents;
  netChange: Cents;
  avgDailySpend: Cents;
  daysUntilNegative: number | null;
} {
  const startingBalance = projection.days[0]?.startingBalance ?? 0;
  const endingBalance =
    projection.days[projection.days.length - 1]?.endingBalance ?? 0;
  const netChange = endingBalance - startingBalance;

  // Calculate average daily spending (expenses only)
  const avgDailySpend =
    projection.days.length > 0
      ? Math.round(projection.totalExpenses / projection.days.length)
      : 0;

  // Find first negative day
  let daysUntilNegative: number | null = null;
  for (let i = 0; i < projection.days.length; i++) {
    if (projection.days[i].isNegative) {
      daysUntilNegative = i;
      break;
    }
  }

  return {
    startingBalance,
    endingBalance,
    netChange,
    avgDailySpend,
    daysUntilNegative,
  };
}

/**
 * Simulate cashflow with and without OPTIONAL events
 * Shows if postponing optional expenses would fix negative balance
 */
export function simulatePriorityScenarios(
  input: CashflowInput
): PrioritySimulationResult {
  // Run original projection
  const originalProjection = buildCashflowProjection(input);

  // Filter out OPTIONAL events (expenses only, keep incomes)
  const eventsWithoutOptional = input.events.filter(
    (e) => e.priority !== "OPTIONAL" || e.type === "INCOME"
  );

  // Find optional events that could be postponed
  const postponableEvents = input.events
    .filter(
      (e) =>
        e.priority === "OPTIONAL" &&
        e.type !== "INCOME" &&
        e.status !== "CONFIRMED" &&
        e.status !== "SKIPPED"
    )
    .map((e) => ({
      id: e.id,
      description: e.description,
      amount: e.amount,
      date: e.date,
      priority: e.priority as EventPriority,
    }));

  // Calculate potential savings from postponing optional events
  const potentialSavings = postponableEvents.reduce(
    (sum, e) => sum + Math.abs(e.amount),
    0
  );

  // Run projection without optional events
  const projectionWithoutOptional = buildCashflowProjection({
    ...input,
    events: eventsWithoutOptional,
  });

  // Check if the situation would recover
  const wouldRecover =
    originalProjection.negativeDays > 0 &&
    projectionWithoutOptional.negativeDays === 0;

  // Generate suggestion based on results
  let suggestion: string | null = null;

  if (originalProjection.negativeDays > 0) {
    if (wouldRecover && postponableEvents.length > 0) {
      suggestion = `Adiando ${postponableEvents.length} gasto(s) opcional(is) (${formatCurrency(potentialSavings)}), seu saldo ficaria positivo.`;
    } else if (postponableEvents.length > 0 && projectionWithoutOptional.negativeDays < originalProjection.negativeDays) {
      suggestion = `Adiando gastos opcionais, você reduziria os dias com saldo negativo de ${originalProjection.negativeDays} para ${projectionWithoutOptional.negativeDays}.`;
    } else if (postponableEvents.length === 0) {
      suggestion = "Não há gastos opcionais para adiar. Considere revisar suas despesas importantes.";
    } else {
      suggestion = "Mesmo adiando gastos opcionais, o saldo continuará negativo. Revise suas despesas obrigatórias.";
    }
  }

  return {
    original: {
      lowestBalance: originalProjection.lowestBalance,
      negativeDays: originalProjection.negativeDays,
      criticalDays: originalProjection.criticalDays,
    },
    withoutOptional: {
      lowestBalance: projectionWithoutOptional.lowestBalance,
      negativeDays: projectionWithoutOptional.negativeDays,
      criticalDays: projectionWithoutOptional.criticalDays,
    },
    postponableEvents,
    potentialSavings,
    wouldRecover,
    suggestion,
  };
}
