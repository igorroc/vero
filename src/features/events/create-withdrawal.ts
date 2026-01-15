"use server";

import prisma from "@/lib/db";
import { getUserBySession } from "@/lib/auth";
import type { Event } from "@prisma/client";
import { dollarsToCents } from "@/types/finance";

export interface CreateWithdrawalInput {
  fromAccountId: string; // Must be INVESTMENT account
  toAccountId: string; // Must NOT be INVESTMENT account
  amount: number; // In dollars, positive value
  description?: string;
  date: Date;
}

export type CreateWithdrawalResult =
  | { success: true; withdrawalEvent: Event; depositEvent: Event }
  | { success: false; error: string };

/**
 * Create a withdrawal (resgate) from an investment account to another account.
 * This creates two linked events:
 * 1. A negative event on the investment account (withdrawal)
 * 2. A positive event on the destination account (deposit)
 */
export async function createWithdrawal(
  input: CreateWithdrawalInput
): Promise<CreateWithdrawalResult> {
  try {
    const user = await getUserBySession();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Validate source account (must be INVESTMENT)
    const fromAccount = await prisma.account.findFirst({
      where: {
        id: input.fromAccountId,
        userId: user.id,
      },
    });

    if (!fromAccount) {
      return { success: false, error: "Conta de origem não encontrada" };
    }

    if (fromAccount.type !== "INVESTMENT") {
      return { success: false, error: "A conta de origem deve ser uma conta de investimento" };
    }

    // Validate destination account (must NOT be INVESTMENT)
    const toAccount = await prisma.account.findFirst({
      where: {
        id: input.toAccountId,
        userId: user.id,
      },
    });

    if (!toAccount) {
      return { success: false, error: "Conta de destino não encontrada" };
    }

    if (toAccount.type === "INVESTMENT") {
      return { success: false, error: "A conta de destino não pode ser uma conta de investimento" };
    }

    // Validate amount
    if (input.amount <= 0) {
      return { success: false, error: "O valor deve ser positivo" };
    }

    const amountCents = dollarsToCents(input.amount);
    const description = input.description || `Resgate de ${fromAccount.name}`;

    // Create both events in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create withdrawal event (negative on investment account)
      const withdrawalEvent = await tx.event.create({
        data: {
          userId: user.id,
          accountId: input.fromAccountId,
          description: `Resgate: ${description}`,
          amount: -amountCents, // Negative (money leaving)
          type: "EXPENSE", // Treated as expense from investment
          costType: "EXCEPTIONAL",
          status: "CONFIRMED", // Already confirmed since it's a transfer
          priority: "REQUIRED",
          date: input.date,
          isRecurrenceTemplate: false,
        },
      });

      // Create deposit event (positive on destination account)
      const depositEvent = await tx.event.create({
        data: {
          userId: user.id,
          accountId: input.toAccountId,
          description: `Resgate: ${description}`,
          amount: amountCents, // Positive (money arriving)
          type: "INCOME",
          costType: null,
          status: "CONFIRMED", // Already confirmed since it's a transfer
          priority: "REQUIRED",
          date: input.date,
          isRecurrenceTemplate: false,
          // Link to the withdrawal event for reference
          recurrenceId: withdrawalEvent.id,
        },
      });

      return { withdrawalEvent, depositEvent };
    });

    return {
      success: true,
      withdrawalEvent: result.withdrawalEvent,
      depositEvent: result.depositEvent,
    };
  } catch (error) {
    console.error("Failed to create withdrawal:", error);
    return { success: false, error: "Falha ao criar resgate" };
  }
}
