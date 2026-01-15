"use server";

import prisma from "@/lib/db";
import { getUserBySession } from "@/lib/auth";
import type { Account, AccountType } from "@prisma/client";
import { dollarsToCents } from "@/types/finance";

export interface CreateAccountInput {
  name: string;
  type: AccountType;
  initialBalance: number; // In dollars for user convenience
}

export type CreateAccountResult =
  | { success: true; account: Account }
  | { success: false; error: string };

export async function createAccount(
  input: CreateAccountInput
): Promise<CreateAccountResult> {
  try {
    const user = await getUserBySession();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Validate input
    if (!input.name || input.name.trim().length === 0) {
      return { success: false, error: "Account name is required" };
    }

    if (!["BANK", "CASH", "INVESTMENT"].includes(input.type)) {
      return { success: false, error: "Invalid account type" };
    }

    // Convert dollars to cents
    const initialBalanceCents = dollarsToCents(input.initialBalance);

    const account = await prisma.account.create({
      data: {
        userId: user.id,
        name: input.name.trim(),
        type: input.type,
        initialBalance: initialBalanceCents,
      },
    });

    return { success: true, account };
  } catch (error) {
    console.error("Failed to create account:", error);
    return { success: false, error: "Failed to create account" };
  }
}
