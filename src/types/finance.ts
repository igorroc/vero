import type {
  Account,
  Event,
  EventType,
  EventStatus,
  EventPriority,
  CostType,
  RecurrenceFrequency,
  InvestmentPlan,
  HorizonMode,
} from "@prisma/client";

// Re-export Prisma types for convenience
export type {
  Account,
  Event,
  EventType,
  EventStatus,
  EventPriority,
  CostType,
  RecurrenceFrequency,
  InvestmentPlan,
  HorizonMode,
};

// ============================================
// MONETARY UTILITIES
// ============================================

/**
 * All monetary values are stored as integers in cents.
 * This type alias makes intentions clear.
 */
export type Cents = number;

/**
 * Convert dollars to cents
 */
export function dollarsToCents(dollars: number): Cents {
  return Math.round(dollars * 100);
}

/**
 * Convert cents to dollars
 */
export function centsToDollars(cents: Cents): number {
  return cents / 100;
}

/**
 * Format cents as currency string
 */
export function formatCurrency(cents: Cents, locale = "pt-BR", currency = "BRL"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(centsToDollars(cents));
}

// ============================================
// DATE UTILITIES
// ============================================

/**
 * Get start of day in UTC
 */
export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/**
 * Get end of day in UTC
 */
export function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(23, 59, 59, 999);
  return d;
}

/**
 * Get end of month
 */
export function endOfMonth(date: Date): Date {
  const d = new Date(date);
  d.setUTCMonth(d.getUTCMonth() + 1, 0);
  d.setUTCHours(23, 59, 59, 999);
  return d;
}

/**
 * Add days to a date
 */
export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

/**
 * Get number of days between two dates (inclusive)
 */
export function daysBetween(start: Date, end: Date): number {
  const startDay = startOfDay(start);
  const endDay = startOfDay(end);
  const diffTime = endDay.getTime() - startDay.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

/**
 * Check if two dates are the same day
 */
export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

/**
 * Format date as YYYY-MM-DD
 */
export function formatDateISO(date: Date): string {
  return date.toISOString().split("T")[0];
}

// ============================================
// CASHFLOW TYPES
// ============================================

/**
 * A single day in the cashflow projection
 */
export interface CashflowDay {
  date: Date;
  dateKey: string; // YYYY-MM-DD format for easy lookup
  startingBalance: Cents;
  events: CashflowEvent[];
  netChange: Cents;
  endingBalance: Cents;
  isNegative: boolean;
  isCritical: boolean; // Below safety buffer
}

/**
 * Event data for cashflow display
 */
export interface CashflowEvent {
  id: string;
  description: string;
  amount: Cents;
  type: EventType;
  costType: CostType | null;
  status: EventStatus;
  priority: EventPriority;
  accountId: string;
  accountName: string;
}

/**
 * Complete cashflow projection
 */
export interface CashflowProjection {
  startDate: Date;
  endDate: Date;
  days: CashflowDay[];
  totalIncome: Cents;
  totalExpenses: Cents;
  totalInvestments: Cents;
  netChange: Cents;
  lowestBalance: Cents;
  lowestBalanceDate: Date | null;
  negativeDays: number;
  criticalDays: number;
}

/**
 * Result of priority-based cashflow simulation
 * Shows what happens if OPTIONAL events are postponed
 */
export interface PrioritySimulationResult {
  original: {
    lowestBalance: Cents;
    negativeDays: number;
    criticalDays: number;
  };
  withoutOptional: {
    lowestBalance: Cents;
    negativeDays: number;
    criticalDays: number;
  };
  postponableEvents: Array<{
    id: string;
    description: string;
    amount: Cents;
    date: Date;
    priority: EventPriority;
  }>;
  potentialSavings: Cents;
  wouldRecover: boolean; // True if postponing OPTIONAL events fixes negative balance
  suggestion: string | null; // Human-readable suggestion
}

// ============================================
// DAILY SPENDING LIMIT TYPES
// ============================================

/**
 * Breakdown of daily spending limit calculation
 */
export interface SpendingLimitBreakdown {
  cashNow: Cents;
  requiredExpenses: Cents;
  plannedInvestments: Cents;
  safetyBuffer: Cents;
  availableForSpending: Cents;
  daysUntilHorizon: number;
  dailyLimit: Cents;
  horizonDate: Date;
  horizonMode: HorizonMode;
  isNegative: boolean;
  shortfallReason?: "expenses" | "investments" | "buffer" | "multiple";
}

// ============================================
// NET WORTH TYPES
// ============================================

/**
 * Net worth calculation result
 */
export interface NetWorthSummary {
  currentNetWorth: Cents;
  targetNetWorth: Cents;
  targetDate: Date;
  monthsRemaining: number;
  requiredMonthlyInvestment: Cents;
  currentMonthlyInvestment: Cents;
  isOnTrack: boolean;
  projectedNetWorth: Cents; // At target date given current pace
  gap: Cents; // Positive = ahead, negative = behind
}

/**
 * Account balance breakdown
 */
export interface AccountBalance {
  accountId: string;
  accountName: string;
  accountType: string;
  currentBalance: Cents;
  projectedBalance: Cents; // At end of projection period
}

// ============================================
// NOTIFICATION TYPES
// ============================================

export type NotificationTrigger =
  | "PAYMENT_D7" // 7 days before
  | "PAYMENT_D3" // 3 days before
  | "PAYMENT_D1" // 1 day before
  | "PAYMENT_D0" // Due today
  | "MISSED_INVESTMENT"
  | "NEGATIVE_CASHFLOW";

// ============================================
// INPUT TYPES FOR ENGINES
// ============================================

/**
 * Input for cashflow projection
 */
export interface CashflowInput {
  accounts: Array<{
    id: string;
    name: string;
    initialBalance: Cents;
  }>;
  events: Array<{
    id: string;
    description: string;
    amount: Cents;
    type: EventType;
    costType: CostType | null;
    status: EventStatus;
    priority: EventPriority;
    date: Date;
    accountId: string;
  }>;
  startDate: Date;
  endDate: Date;
  safetyBuffer?: Cents;
}

/**
 * Input for spending limit calculation
 */
export interface SpendingLimitInput {
  currentBalance: Cents;
  events: Array<{
    amount: Cents;
    type: EventType;
    status: EventStatus;
    priority: EventPriority;
    date: Date;
  }>;
  horizonDate: Date;
  horizonMode: HorizonMode;
  safetyBuffer: Cents;
  today?: Date; // For testing
}
