"use server";

import prisma from "@/lib/db";
import { getUserBySession } from "@/lib/auth";
import type { Account, AccountType } from "@prisma/client";
import { dollarsToCents } from "@/types/finance";

export interface UpdateAccountInput {
  id: string;
  name?: string;
  type?: AccountType;
  initialBalance?: number; // In dollars
}

export type UpdateAccountResult =
  | { success: true; account: Account }
  | { success: false; error: string };

export async function updateAccount(
  input: UpdateAccountInput
): Promise<UpdateAccountResult> {
  try {
    const user = await getUserBySession();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Verify ownership
    const existing = await prisma.account.findFirst({
      where: {
        id: input.id,
        userId: user.id,
      },
    });

    if (!existing) {
      return { success: false, error: "Account not found" };
    }

    // Build update data
    const updateData: Partial<{
      name: string;
      type: AccountType;
      initialBalance: number;
    }> = {};

    if (input.name !== undefined) {
      if (input.name.trim().length === 0) {
        return { success: false, error: "Account name cannot be empty" };
      }
      updateData.name = input.name.trim();
    }

    if (input.type !== undefined) {
      if (!["BANK", "CASH", "INVESTMENT"].includes(input.type)) {
        return { success: false, error: "Invalid account type" };
      }
      updateData.type = input.type;
    }

    if (input.initialBalance !== undefined) {
      updateData.initialBalance = dollarsToCents(input.initialBalance);
    }

    const account = await prisma.account.update({
      where: { id: input.id },
      data: updateData,
    });

    return { success: true, account };
  } catch (error) {
    console.error("Failed to update account:", error);
    return { success: false, error: "Failed to update account" };
  }
}
