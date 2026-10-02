"use server"

import prisma from "@/lib/db"
import { getUserBySession } from "@/lib/auth"
import { getBudget } from "@/features/budgets"
import { formatDateInput } from "@/types/finance"
import {
	findMissingExpenses,
	type ExpenseRecord,
	type MissingExpenseItem,
} from "@/lib/engines/missing-expenses"
import { getEventsWithProjection } from "./get-events"

export type GetMissingExpensesResult =
	| { success: true; year: number; month: number; items: MissingExpenseItem[] }
	| { success: false; error: string }

function isValidPeriod(year: number, month: number): boolean {
	return (
		Number.isInteger(year) &&
		year >= 2000 &&
		year <= 2100 &&
		Number.isInteger(month) &&
		month >= 1 &&
		month <= 12
	)
}

/**
 * Lista gastos esperados no mês que ainda não foram lançados (nem PLANNED nem
 * CONFIRMED), combinando histórico recente, custos recorrentes e orçamento.
 */
export async function getMissingExpenses(input: {
	year: number
	month: number
	lookbackMonths?: number
}): Promise<GetMissingExpensesResult> {
	try {
		const user = await getUserBySession()
		if (!user) return { success: false, error: "Não autenticado" }
		const { year, month } = input
		if (!isValidPeriod(year, month))
			return { success: false, error: "Período inválido" }
		const lookbackMonths = Math.min(Math.max(input.lookbackMonths ?? 3, 1), 12)

		const monthStart = new Date(Date.UTC(year, month - 1, 1))
		const monthEnd = new Date(Date.UTC(year, month, 0))
		const historyStart = new Date(
			Date.UTC(year, month - 1 - lookbackMonths, 1),
		)

		// Mês atual com recorrências projetadas (entram como PLANNED).
		const currentResult = await getEventsWithProjection(monthStart, monthEnd)
		if (!currentResult.success)
			return { success: false, error: currentResult.error }

		const historyEvents = await prisma.event.findMany({
			where: {
				userId: user.id,
				isRecurrenceTemplate: false,
				type: "EXPENSE",
				amount: { lt: 0 },
				status: { in: ["PLANNED", "CONFIRMED"] },
				date: { gte: historyStart, lt: monthStart },
			},
			select: {
				categoryId: true,
				description: true,
				amount: true,
				date: true,
				status: true,
				costType: true,
				category: { select: { name: true } },
			},
		})

		const budgetResult = await getBudget(year, month)
		const budgetItems =
			budgetResult.success && budgetResult.budget
				? budgetResult.budget.items.map((item) => ({
						categoryId: item.categoryId,
						categoryName: item.category.name,
						amountCents: item.amount,
					}))
				: []

		const current: ExpenseRecord[] = currentResult.events
			.filter((event) => event.type === "EXPENSE" && event.amount < 0)
			.map((event) => ({
				categoryId: event.categoryId,
				categoryName: null,
				description: event.description,
				amountCents: Math.abs(event.amount),
				date: event.date.toISOString().slice(0, 10),
				status: event.status,
				costType: event.costType ?? null,
			}))

		const history: ExpenseRecord[] = historyEvents.map((event) => ({
			categoryId: event.categoryId,
			categoryName: event.category?.name ?? null,
			description: event.description,
			amountCents: Math.abs(event.amount),
			date: event.date.toISOString().slice(0, 10),
			status: event.status,
			costType: event.costType ?? null,
		}))

		const items = findMissingExpenses({
			periodMonth: `${year}-${String(month).padStart(2, "0")}`,
			today: formatDateInput(new Date()),
			lookbackMonths,
			minOccurrences: 2,
			history,
			current,
			budget: budgetItems,
		})

		return { success: true, year, month, items }
	} catch (error) {
		console.error("Failed to find missing expenses:", error)
		return {
			success: false,
			error: "Não foi possível verificar os gastos não lançados",
		}
	}
}
