"use server"

import prisma from "@/lib/db"
import { getUserBySession } from "@/lib/auth"
import { getEventsWithProjection } from "@/features/events"
import {
	buildMonthlySavings,
	type MonthlySavingsResult,
} from "@/lib/engines/monthly-savings"

export type GetMonthlySavingsResult =
	| { success: true; savings: MonthlySavingsResult }
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
 * Capacidade de economia do mês, com leitura prevista (eventos planejados e
 * parcelas de dívida em aberto) e realizada (eventos confirmados).
 */
export async function getMonthlySavings(
	year: number,
	month: number,
): Promise<GetMonthlySavingsResult> {
	try {
		const user = await getUserBySession()
		if (!user) return { success: false, error: "Não autenticado" }
		if (!isValidPeriod(year, month))
			return { success: false, error: "Período inválido" }

		const startDate = new Date(Date.UTC(year, month - 1, 1))
		const endDate = new Date(Date.UTC(year, month, 1))
		const lastDay = new Date(Date.UTC(year, month, 0))

		const eventsResult = await getEventsWithProjection(startDate, lastDay)
		if (!eventsResult.success) {
			return { success: false, error: eventsResult.error }
		}
		const debtInstallments = await prisma.debtInstallment.findMany({
			where: {
				debt: { userId: user.id, status: "ACTIVE" },
				dueDate: { gte: startDate, lt: endDate },
				plannedAmount: { gt: 0 },
			},
			select: { plannedAmount: true },
		})

		const previsto = sumSavingsAmounts(
			eventsResult.events.filter((event) => event.status === "PLANNED"),
		)
		previsto.expense += debtInstallments.reduce(
			(total, installment) => total + installment.plannedAmount,
			0,
		)
		const realizado = sumSavingsAmounts(
			eventsResult.events.filter((event) => event.status === "CONFIRMED"),
		)

		return { success: true, savings: buildMonthlySavings({ previsto, realizado }) }
	} catch (error) {
		console.error("Failed to get monthly savings:", error)
		return { success: false, error: "Não foi possível calcular a economia" }
	}
}

interface SavingsAmounts {
	income: number
	expense: number
	investment: number
}

function sumSavingsAmounts(
	events: Array<{ type: string; amount: number; status: string }>,
): SavingsAmounts {
	const totals: SavingsAmounts = { income: 0, expense: 0, investment: 0 }
	for (const event of events) {
		if (event.status === "SKIPPED") continue
		if (event.type === "INCOME" && event.amount > 0) {
			totals.income += event.amount
		} else if (event.type === "EXPENSE" && event.amount < 0) {
			totals.expense += Math.abs(event.amount)
		} else if (event.type === "INVESTMENT" && event.amount < 0) {
			totals.investment += Math.abs(event.amount)
		}
	}
	return totals
}
