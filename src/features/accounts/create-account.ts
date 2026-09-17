"use server"

import prisma from "@/lib/db"
import { getUserBySession } from "@/lib/auth"
import type { Account, AccountType } from "@prisma/client"
import { dollarsToCents } from "@/types/finance"
import { canManageInvestmentResource, withLimit } from "@/features/billing"

export interface CreateAccountInput {
	name: string
	type: AccountType
	initialBalance: number // In dollars for user convenience
}

export type CreateAccountResult =
	{ success: true; account: Account } | { success: false; error: string }

export async function createAccount(
	input: CreateAccountInput,
): Promise<CreateAccountResult> {
	try {
		const user = await getUserBySession()
		if (!user) {
			return { success: false, error: "Not authenticated" }
		}
		if (!(await canManageInvestmentResource(user.id, [input.type]))) {
			return {
				success: false,
				error: "O plano atual não permite contas de investimento.",
			}
		}
		// Validate input
		if (!input.name || input.name.trim().length === 0) {
			return { success: false, error: "Account name is required" }
		}

		if (!["BANK", "CASH", "INVESTMENT"].includes(input.type)) {
			return { success: false, error: "Invalid account type" }
		}

		// Convert dollars to cents
		const initialBalanceCents = dollarsToCents(input.initialBalance)

		const accountData = {
			userId: user.id,
			name: input.name.trim(),
			type: input.type,
			initialBalance: initialBalanceCents,
		}
		const account =
			input.type === "INVESTMENT"
				? await prisma.account.create({ data: accountData })
				: await withLimit(user.id, "accounts.active", 1, (tx) =>
						tx.account.create({ data: accountData }),
					)
		if ("allowed" in account && !account.allowed) {
			return {
				success: false,
				error: "Você atingiu o limite de contas ativas do seu plano.",
			}
		}

		return {
			success: true,
			account: "value" in account ? account.value : account,
		}
	} catch (error) {
		console.error("Failed to create account:", error)
		return { success: false, error: "Failed to create account" }
	}
}
