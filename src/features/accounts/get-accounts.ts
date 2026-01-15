"use server";

import prisma from "@/lib/db";
import {getUserBySession} from "@/lib/auth";
import type {Account} from "@prisma/client";

export type GetAccountsResult =
    | { success: true; accounts: Account[] }
    | { success: false; error: string };

export async function getAccounts(): Promise<GetAccountsResult> {
    try {
        const user = await getUserBySession();
        if (!user) {
            return {success: false, error: "Not authenticated"};
        }

        const accounts = await prisma.account.findMany({
            where: {
                userId: user.id,
                isActive: true,
            },
            orderBy: {
                createdAt: "asc",
            },
        });

        return {success: true, accounts};
    } catch (error) {
        console.error("Failed to get accounts:", error);
        return {success: false, error: "Failed to fetch accounts"};
    }
}

export async function getAccountById(
    accountId: string
): Promise<Account | null> {
    try {
        const user = await getUserBySession();
        if (!user) return null;

        return await prisma.account.findFirst({
            where: {
                id: accountId,
                userId: user.id,
            },
        });
    } catch (error) {
        console.error("Failed to get account:", error);
        return null;
    }
}
