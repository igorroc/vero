"use server"

import prisma from "@/lib/db"
import { getUserBySession } from "@/lib/auth"
import { canUse } from "@/features/billing"
import {
	buildSpendingByCategoryReport,
	type SpendingIconGroup,
} from "@/lib/engines/spending-by-category"

export type GetSpendingByCategoryResult =
	| { success: true; groups: SpendingIconGroup[] }
	| { success: false; error: string }

export type GetCurrentSpendingByCategoryResult = GetSpendingByCategoryResult

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
 * Gastos confirmados agrupados por tipo de ícone, no mês informado.
 * Usado pela tela /reports/spending e pela assistente (com filtro de mês).
 */
export async function getSpendingByCategory(
	year: number,
	month: number,
): Promise<GetSpendingByCategoryResult> {
	try {
		const user = await getUserBySession()
		if (!user) return { success: false, error: "Não autenticado" }
		if (!isValidPeriod(year, month))
			return { success: false, error: "Período inválido" }
		if (!(await canUse(user.id, "reports.detailed"))) {
			return {
				success: false,
				error: "O plano atual não permite visualizar este relatório.",
			}
		}

		const startDate = new Date(Date.UTC(year, month - 1, 1))
		const endDate = new Date(Date.UTC(year, month, 1))
		const events = await prisma.event.findMany({
			where: {
				userId: user.id,
				status: "CONFIRMED",
				type: "EXPENSE",
				amount: { lt: 0 },
				date: { gte: startDate, lt: endDate },
			},
			select: {
				description: true,
				amount: true,
				category: { select: { name: true, categoryGroupId: true } },
			},
		})

		return {
			success: true,
			groups: buildSpendingByCategoryReport(
				events.map((event) => ({
					description: event.description,
					amount: event.amount,
					categoryName: event.category?.name ?? null,
					categoryGroupId: event.category?.categoryGroupId ?? null,
				})),
			),
		}
	} catch (error) {
		console.error("Failed to get spending by category:", error)
		return { success: false, error: "Não foi possível carregar os gastos" }
	}
}

/**
 * Mês corrente do usuário (fuso local do servidor).
 */
export async function getCurrentSpendingByCategory(): Promise<GetCurrentSpendingByCategoryResult> {
	const now = new Date()
	return getSpendingByCategory(now.getFullYear(), now.getMonth() + 1)
}
