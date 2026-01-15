"use server";

import prisma from "@/lib/db";
import {getUserBySession} from "@/lib/auth";
import {getAccountBalances} from "@/features/accounts";
import {getTotalMonthlyInvestment} from "@/features/investments";
import type {NetWorthGoal} from "@prisma/client";
import {dollarsToCents, type NetWorthSummary} from "@/types/finance";

// ============================================
// GET
// ============================================

export type GetNetWorthGoalResult =
    | { success: true; goal: NetWorthGoal | null }
    | { success: false; error: string };

export async function getNetWorthGoal(): Promise<GetNetWorthGoalResult> {
    try {
        const user = await getUserBySession();
        if (!user) {
            return {success: false, error: "Not authenticated"};
        }

        const goal = await prisma.netWorthGoal.findUnique({
            where: {userId: user.id},
        });

        return {success: true, goal};
    } catch (error) {
        console.error("Failed to get net worth goal:", error);
        return {success: false, error: "Failed to fetch net worth goal"};
    }
}

// ============================================
// SET/UPDATE
// ============================================

export interface SetNetWorthGoalInput {
    targetAmount: number; // In dollars
    targetDate: Date;
}

export type SetNetWorthGoalResult =
    | { success: true; goal: NetWorthGoal }
    | { success: false; error: string };

export async function setNetWorthGoal(
    input: SetNetWorthGoalInput
): Promise<SetNetWorthGoalResult> {
    try {
        const user = await getUserBySession();
        if (!user) {
            return {success: false, error: "Not authenticated"};
        }

        // Validate
        if (input.targetAmount <= 0) {
            return {success: false, error: "Target amount must be positive"};
        }

        if (input.targetDate <= new Date()) {
            return {success: false, error: "Target date must be in the future"};
        }

        const goal = await prisma.netWorthGoal.upsert({
            where: {userId: user.id},
            update: {
                targetAmount: dollarsToCents(input.targetAmount),
                targetDate: input.targetDate,
            },
            create: {
                userId: user.id,
                targetAmount: dollarsToCents(input.targetAmount),
                targetDate: input.targetDate,
            },
        });

        return {success: true, goal};
    } catch (error) {
        console.error("Failed to set net worth goal:", error);
        return {success: false, error: "Failed to set net worth goal"};
    }
}

// ============================================
// DELETE
// ============================================

export type DeleteNetWorthGoalResult =
    | { success: true }
    | { success: false; error: string };

export async function deleteNetWorthGoal(): Promise<DeleteNetWorthGoalResult> {
    try {
        const user = await getUserBySession();
        if (!user) {
            return {success: false, error: "Not authenticated"};
        }

        await prisma.netWorthGoal.delete({
            where: {userId: user.id},
        });

        return {success: true};
    } catch (error) {
        console.error("Failed to delete net worth goal:", error);
        return {success: false, error: "Failed to delete net worth goal"};
    }
}

// ============================================
// SUMMARY
// ============================================

export type GetNetWorthSummaryResult =
    | { success: true; summary: NetWorthSummary }
    | { success: false; error: string };

export async function getNetWorthSummary(): Promise<GetNetWorthSummaryResult> {
    try {
        const user = await getUserBySession();
        if (!user) {
            return {success: false, error: "Not authenticated"};
        }

        // Get current balance (only from investment accounts for net worth)
        const balancesResult = await getAccountBalances();
        if (!balancesResult.success) {
            return {success: false, error: balancesResult.error};
        }

        // For net worth, we consider ALL accounts
        const currentNetWorth = balancesResult.totalBalance;

        // Get goal
        const goal = await prisma.netWorthGoal.findUnique({
            where: {userId: user.id},
        });

        if (!goal) {
            return {
                success: false,
                error: "No net worth goal set",
            };
        }

        // Calculate months remaining
        const now = new Date();
        const targetDate = new Date(goal.targetDate);
        const monthsRemaining = Math.max(
            0,
            (targetDate.getFullYear() - now.getFullYear()) * 12 +
            (targetDate.getMonth() - now.getMonth())
        );

        // Get current monthly investment from active plans
        const currentMonthlyInvestment = await getTotalMonthlyInvestment();

        // Calculate required monthly investment to reach goal
        const amountNeeded = goal.targetAmount - currentNetWorth;
        const requiredMonthlyInvestment =
            monthsRemaining > 0 ? Math.max(0, amountNeeded / monthsRemaining) : 0;

        // Project net worth at target date given current pace
        const projectedNetWorth =
            currentNetWorth + currentMonthlyInvestment * monthsRemaining;

        // Determine if on track
        const isOnTrack = projectedNetWorth >= goal.targetAmount;

        // Calculate gap
        const gap = projectedNetWorth - goal.targetAmount;

        const summary: NetWorthSummary = {
            currentNetWorth,
            targetNetWorth: goal.targetAmount,
            targetDate,
            monthsRemaining,
            requiredMonthlyInvestment: Math.round(requiredMonthlyInvestment),
            currentMonthlyInvestment: Math.round(currentMonthlyInvestment),
            isOnTrack,
            projectedNetWorth,
            gap,
        };

        return {success: true, summary};
    } catch (error) {
        console.error("Failed to get net worth summary:", error);
        return {success: false, error: "Failed to calculate net worth summary"};
    }
}
