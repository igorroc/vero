"use server";

import prisma from "@/lib/db";
import { getUserBySession } from "@/lib/auth";

export type DeleteAccountResult =
  | { success: true }
  | { success: false; error: string };

export async function deleteAccount(
  accountId: string
): Promise<DeleteAccountResult> {
  try {
    const user = await getUserBySession();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Verify ownership
    const existing = await prisma.account.findFirst({
      where: {
        id: accountId,
        userId: user.id,
      },
    });

    if (!existing) {
      return { success: false, error: "Account not found" };
    }

    // Soft delete by setting isActive to false
    // This preserves historical data while hiding the account
    await prisma.account.update({
      where: { id: accountId },
      data: { isActive: false },
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to delete account:", error);
    return { success: false, error: "Failed to delete account" };
  }
}

/**
 * Permanently delete an account and all associated data
 * Use with caution - this cannot be undone
 */
export async function hardDeleteAccount(
  accountId: string
): Promise<DeleteAccountResult> {
  try {
    const user = await getUserBySession();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Verify ownership
    const existing = await prisma.account.findFirst({
      where: {
        id: accountId,
        userId: user.id,
      },
    });

    if (!existing) {
      return { success: false, error: "Account not found" };
    }

    // Delete account (cascades to events due to onDelete: Cascade)
    await prisma.account.delete({
      where: { id: accountId },
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to hard delete account:", error);
    return { success: false, error: "Failed to delete account" };
  }
}
