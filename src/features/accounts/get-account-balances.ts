"use server";

import prisma from "@/lib/db";
import {getUserBySession} from "@/lib/auth";
import type {Cents} from "@/types/finance";
import {startOfDay} from "@/types/finance";
import {AccountType} from "@prisma/client";

export interface AccountWithBalance {
    id: string;
    name: string;
    type: AccountType;
    initialBalance: Cents;
    currentBalance: Cents;
}

export type GetAccountBalancesResult =
    | { success: true; accounts: AccountWithBalance[]; totalBalance: Cents }
    | { success: false; error: string };

/**
 * Get all accounts with their current balances
 * Current balance = initial balance + sum of all confirmed events
 */
export async function getAccountBalances(
    asOfDate: Date = new Date()
): Promise<GetAccountBalancesResult> {
    try {
        const user = await getUserBySession();
        if (!user) {
            return {success: false, error: "Not authenticated"};
        }

        const targetDate = startOfDay(asOfDate);

        // Get all active accounts
        const accounts = await prisma.account.findMany({
            where: {
                userId: user.id,
                isActive: true,
            },
            include: {
                events: {
                    where: {
                        status: "CONFIRMED",
                        date: {
                            lte: targetDate,
                        },
                    },
                    select: {
                        amount: true,
                    },
                },
            },
            orderBy: {
                createdAt: "asc",
            },
        });

        const accountsWithBalances: AccountWithBalance[] = accounts.map((account) => {
            const confirmedTotal = account.events.reduce(
                (sum, event) => sum + event.amount,
                0
            );
            const currentBalance = account.initialBalance + confirmedTotal;

            return {
                id: account.id,
                name: account.name,
                type: account.type,
                initialBalance: account.initialBalance,
                currentBalance,
            };
        });

        const totalBalance = accountsWithBalances.reduce(
            (sum, acc) => sum + acc.currentBalance,
            0
        );

        return {
            success: true,
            accounts: accountsWithBalances,
            totalBalance,
        };
    } catch (error) {
        console.error("Failed to get account balances:", error);
        return {success: false, error: "Failed to fetch account balances"};
    }
}
