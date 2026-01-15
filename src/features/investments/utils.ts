import type {InvestmentPlan} from "@prisma/client";

/**
 * Calculate monthly investment amount from a plan
 */
export function getMonthlyInvestmentAmount(plan: InvestmentPlan): number {
    switch (plan.frequency) {
        case "WEEKLY":
            return plan.amount * 4.33; // Average weeks per month
        case "BIWEEKLY":
            return plan.amount * 2.17;
        case "MONTHLY":
            return plan.amount;
        case "YEARLY":
            return plan.amount / 12;
        default:
            return plan.amount;
    }
}
