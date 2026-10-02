"use server"

import prisma from "@/lib/db"
import { getUserBySession } from "@/lib/auth"
import { canUse } from "@/features/billing"
import {
	buildSpendingByCategoryReport,
	type SpendingGroupSummary,
} from "@/lib/engines/spending-by-category"

export type GetSpendingByCategoryResult =
	| { success: true; groups: SpendingGroupSummary[] }
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
				amount: true,
				category: {
					select: {
						id: true,
						name: true,
						categoryGroupId: true,
						categoryGroup: { select: { name: true, type: true } },
					},
				},
			},
		})

		return {
			success: true,
			groups: buildSpendingByCategoryReport(
				events.map((event) => ({
					categoryId: event.category?.id ?? null,
					categoryName: event.category?.name ?? null,
					categoryGroupId: event.category?.categoryGroupId ?? null,
					categoryGroupName: event.category?.categoryGroup?.name ?? null,
					categoryGroupType: event.category?.categoryGroup?.type ?? null,
					amount: event.amount,
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
