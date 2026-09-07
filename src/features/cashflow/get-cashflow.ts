"use server"

import { getUserBySession } from "@/lib/auth"
import { getAccountBalances } from "@/features/accounts"
import { getEventsWithProjection } from "@/features/events"
import { buildCashflowProjection } from "@/lib/engines/cashflow"
import type { CashflowProjection } from "@/types/finance"
import { addDays, startOfDay } from "@/types/finance"
import prisma from "@/lib/db"

export type GetCashflowResult =
	| { success: true; projection: CashflowProjection }
	| { success: false; error: string }

export async function getCashflowProjection(
	days: number = 30,
): Promise<GetCashflowResult> {
	try {
		const user = await getUserBySession()
		if (!user) {
			return { success: false, error: "Not authenticated" }
		}

		// Get user settings for safety buffer
		const settings = await prisma.userSettings.findUnique({
			where: { userId: user.id },
		})
		const safetyBuffer = settings?.safetyBuffer ?? 0

		// Get account balances
		const balancesResult = await getAccountBalances()
		if (!balancesResult.success) {
			return { success: false, error: balancesResult.error }
		}

		const { accounts } = balancesResult

		// Get events for projection
		const today = startOfDay(new Date())
		const endDate = addDays(today, days)

		const eventsResult = await getEventsWithProjection(today, endDate)
		if (!eventsResult.success) {
			return { success: false, error: eventsResult.error }
		}
		const debtInstallments = await prisma.debtInstallment.findMany({
			where: {
				debt: { userId: user.id, status: "ACTIVE" },
				dueDate: { gte: today, lte: endDate },
				plannedAmount: { gt: 0 },
			},
			include: { debt: { select: { creditor: true } } },
		})

		// Build projection
		const projection = buildCashflowProjection({
			accounts: [
				...accounts.map((a) => ({
					id: a.id,
					name: a.name,
					initialBalance: a.currentBalance, // Use current balance
				})),
				{
					id: "debt-projection",
					name: "Dívidas (conta a definir)",
					initialBalance: 0,
				},
			],
			events: eventsResult.events
				.filter((e) => e.status !== "SKIPPED")
				.map((e) => ({
					id: e.id,
					description: e.description,
					amount: e.amount,
					type: e.type,
					costType: e.costType,
					status: e.status,
					priority: e.priority,
					date: e.date,
					accountId: e.accountId,
					destinationAccountId: e.destinationAccountId,
				}))
				.concat(
					debtInstallments.map((installment) => ({
						id: `debt-${installment.id}`,
						description: `Parcela de dívida - ${installment.debt.creditor}`,
						amount: -installment.plannedAmount,
						type: "EXPENSE" as const,
						costType: "RECURRENT" as const,
						status: "PLANNED" as const,
						priority: "REQUIRED" as const,
						date: installment.dueDate,
						accountId: "debt-projection",
						destinationAccountId: null,
					})),
				),
			startDate: today,
			endDate,
			safetyBuffer,
		})

		return { success: true, projection }
	} catch (error) {
		console.error("Failed to get cashflow projection:", error)
		return { success: false, error: "Failed to load cashflow" }
	}
}
