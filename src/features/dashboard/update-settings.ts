"use server";

import prisma from "@/lib/db";
import { getUserBySession } from "@/lib/auth";
import type { HorizonMode, UserSettings } from "@prisma/client";
import { dollarsToCents } from "@/types/finance";

export interface UpdateSettingsInput {
  safetyBuffer?: number; // In dollars
  horizonMode?: HorizonMode;
}

export type UpdateSettingsResult =
  | { success: true; settings: UserSettings }
  | { success: false; error: string };

export async function updateSettings(
  input: UpdateSettingsInput
): Promise<UpdateSettingsResult> {
  try {
    const user = await getUserBySession();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const updateData: Partial<{ safetyBuffer: number; horizonMode: HorizonMode }> = {};

    if (input.safetyBuffer !== undefined) {
      updateData.safetyBuffer = dollarsToCents(input.safetyBuffer);
    }

    if (input.horizonMode !== undefined) {
      if (!["NEXT_INCOME", "END_OF_MONTH"].includes(input.horizonMode)) {
        return { success: false, error: "Invalid horizon mode" };
      }
      updateData.horizonMode = input.horizonMode;
    }

    const settings = await prisma.userSettings.upsert({
      where: { userId: user.id },
      update: updateData,
      create: {
        userId: user.id,
        ...updateData,
      },
    });

    return { success: true, settings };
  } catch (error) {
    console.error("Failed to update settings:", error);
    return { success: false, error: "Failed to update settings" };
  }
}
