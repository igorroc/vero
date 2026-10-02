"use server"

import prisma from "@/lib/db"
import { getUserBySession } from "@/lib/auth"

export type TopExpense = {
	description: string
	categoryName: string | null
	/** Magnitude do gasto (sempre positivo). */
	amountCents: number
	/** YYYY-MM-DD */
	date: string
	status: string
}

export type GetTopExpensesResult =
	| { success: true; expenses: TopExpense[] }
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
 * Maiores despesas do mês (confirmadas e planejadas), ordenadas por valor
 * decrescente. Usado pela assistente para o ranking de gastos.
 */
export async function getTopExpenses(input: {
	year: number
	month: number
}): Promise<GetTopExpensesResult> {
	try {
		const user = await getUserBySession()
		if (!user) return { success: false, error: "Não autenticado" }
		const { year, month } = input
		if (!isValidPeriod(year, month))
			return { success: false, error: "Período inválido" }

		const start = new Date(Date.UTC(year, month - 1, 1))
		const end = new Date(Date.UTC(year, month, 1))
		const events = await prisma.event.findMany({
			where: {
				userId: user.id,
				isRecurrenceTemplate: false,
				type: "EXPENSE",
				amount: { lt: 0 },
				status: { in: ["PLANNED", "CONFIRMED"] },
				date: { gte: start, lt: end },
			},
			select: {
				description: true,
				amount: true,
				date: true,
				status: true,
				category: { select: { name: true } },
			},
			orderBy: { amount: "asc" },
		})

		return {
			success: true,
			expenses: events.map((event) => ({
				description: event.description,
				categoryName: event.category?.name ?? null,
				amountCents: Math.abs(event.amount),
				date: event.date.toISOString().slice(0, 10),
				status: event.status,
			})),
		}
	} catch (error) {
		console.error("Failed to get top expenses:", error)
		return { success: false, error: "Não foi possível carregar os gastos" }
	}
}
