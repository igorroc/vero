"use server";

import prisma from "@/lib/db";
import { getUserBySession } from "@/lib/auth";
import type { InvestmentPlan, InvestmentFrequency } from "@prisma/client";
import { dollarsToCents } from "@/types/finance";

// ============================================
// GET
// ============================================

export type GetInvestmentPlansResult =
  | { success: true; plans: InvestmentPlan[] }
  | { success: false; error: string };

export async function getInvestmentPlans(): Promise<GetInvestmentPlansResult> {
  try {
    const user = await getUserBySession();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const plans = await prisma.investmentPlan.findMany({
      where: {
        userId: user.id,
      },
      include: {
        account: {
          select: { name: true, type: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return { success: true, plans };
  } catch (error) {
    console.error("Failed to get investment plans:", error);
    return { success: false, error: "Failed to fetch investment plans" };
  }
}

// ============================================
// CREATE
// ============================================

export interface CreateInvestmentPlanInput {
  accountId: string;
  name: string;
  amount: number; // In dollars
  frequency: InvestmentFrequency;
  dayOfExecution?: number; // Day of month/week
  startDate: Date;
  endDate?: Date | null;
}

export type CreateInvestmentPlanResult =
  | { success: true; plan: InvestmentPlan }
  | { success: false; error: string };

export async function createInvestmentPlan(
  input: CreateInvestmentPlanInput
): Promise<CreateInvestmentPlanResult> {
  try {
    const user = await getUserBySession();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Verify account ownership
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
    if (!input.name || input.name.trim().length === 0) {
      return { success: false, error: "Plan name is required" };
    }

    if (input.amount <= 0) {
      return { success: false, error: "Amount must be positive" };
    }

    const plan = await prisma.investmentPlan.create({
      data: {
        userId: user.id,
        accountId: input.accountId,
        name: input.name.trim(),
        amount: dollarsToCents(input.amount),
        frequency: input.frequency,
        dayOfExecution: input.dayOfExecution ?? 1,
        startDate: input.startDate,
        endDate: input.endDate,
        isActive: true,
      },
    });

    return { success: true, plan };
  } catch (error) {
    console.error("Failed to create investment plan:", error);
    return { success: false, error: "Failed to create investment plan" };
  }
}

// ============================================
// UPDATE
// ============================================

export interface UpdateInvestmentPlanInput {
  id: string;
  name?: string;
  amount?: number; // In dollars
  frequency?: InvestmentFrequency;
  dayOfExecution?: number;
  endDate?: Date | null;
  isActive?: boolean;
}

export type UpdateInvestmentPlanResult =
  | { success: true; plan: InvestmentPlan }
  | { success: false; error: string };

export async function updateInvestmentPlan(
  input: UpdateInvestmentPlanInput
): Promise<UpdateInvestmentPlanResult> {
  try {
    const user = await getUserBySession();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Verify ownership
    const existing = await prisma.investmentPlan.findFirst({
      where: {
        id: input.id,
        userId: user.id,
      },
    });

    if (!existing) {
      return { success: false, error: "Investment plan not found" };
    }

    const updateData: Record<string, unknown> = {};

    if (input.name !== undefined) {
      updateData.name = input.name.trim();
    }
    if (input.amount !== undefined) {
      updateData.amount = dollarsToCents(input.amount);
    }
    if (input.frequency !== undefined) {
      updateData.frequency = input.frequency;
    }
    if (input.dayOfExecution !== undefined) {
      updateData.dayOfExecution = input.dayOfExecution;
    }
    if (input.endDate !== undefined) {
      updateData.endDate = input.endDate;
    }
    if (input.isActive !== undefined) {
      updateData.isActive = input.isActive;
    }

    const plan = await prisma.investmentPlan.update({
      where: { id: input.id },
      data: updateData,
    });

    return { success: true, plan };
  } catch (error) {
    console.error("Failed to update investment plan:", error);
    return { success: false, error: "Failed to update investment plan" };
  }
}

// ============================================
// DELETE
// ============================================

export type DeleteInvestmentPlanResult =
  | { success: true }
  | { success: false; error: string };

export async function deleteInvestmentPlan(
  planId: string
): Promise<DeleteInvestmentPlanResult> {
  try {
    const user = await getUserBySession();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Verify ownership
    const existing = await prisma.investmentPlan.findFirst({
      where: {
        id: planId,
        userId: user.id,
      },
    });

    if (!existing) {
      return { success: false, error: "Investment plan not found" };
    }

    await prisma.investmentPlan.delete({
      where: { id: planId },
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to delete investment plan:", error);
    return { success: false, error: "Failed to delete investment plan" };
  }
}

// ============================================
// HELPERS
// ============================================

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

/**
 * Get total monthly investment across all active plans
 */
export async function getTotalMonthlyInvestment(): Promise<number> {
  const user = await getUserBySession();
  if (!user) return 0;

  const plans = await prisma.investmentPlan.findMany({
    where: {
      userId: user.id,
      isActive: true,
    },
  });

  return plans.reduce((total, plan) => {
    return total + getMonthlyInvestmentAmount(plan);
  }, 0);
}
