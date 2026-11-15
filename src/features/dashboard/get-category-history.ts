"use server"

import { getUserBySession } from "@/lib/auth"
import prisma from "@/lib/db"

export interface CategoryHistory {
	categories: Array<{ id: string; name: string }>
	months: Array<{ month: string; totals: Record<string, number> }>
}

export type GetCategoryHistoryResult =
	{ success: true; data: CategoryHistory } | { success: false; error: string }

export async function getCategoryHistory(
	categoryIds: string[],
): Promise<GetCategoryHistoryResult> {
	try {
		const user = await getUserBySession()
		if (!user) return { success: false, error: "Não autenticado" }
		if (
			!Array.isArray(categoryIds) ||
			categoryIds.length > 3 ||
			categoryIds.some((id) => typeof id !== "string" || id.trim() === "") ||
			new Set(categoryIds).size !== categoryIds.length
		) {
			return { success: false, error: "Selecione até 3 categorias distintas" }
		}

		const now = new Date()
		const year = now.getUTCFullYear()
		const month = now.getUTCMonth()
		const startDate = new Date(Date.UTC(year, month - 5, 1))
		const endDate = new Date(Date.UTC(year, month + 1, 1))
		const months = Array.from({ length: 6 }, (_, index) => ({
			month: new Date(Date.UTC(year, month - 5 + index, 1))
				.toISOString()
				.slice(0, 7),
			totals: Object.fromEntries(categoryIds.map((id) => [id, 0])),
		}))
		if (categoryIds.length === 0) {
			return { success: true, data: { categories: [], months } }
		}

		const categories = await prisma.category.findMany({
			where: { userId: user.id, id: { in: categoryIds } },
			select: { id: true, name: true },
		})
		if (categories.length !== categoryIds.length) {
			return { success: false, error: "Categorias inválidas" }
		}

		const events = await prisma.event.findMany({
			where: {
				userId: user.id,
				categoryId: { in: categoryIds },
				status: "CONFIRMED",
				type: { not: "TRANSFER" },
				date: { gte: startDate, lt: endDate },
			},
			select: { categoryId: true, amount: true, date: true },
		})
		for (const event of events) {
			if (!event.categoryId) continue
			const index =
				(event.date.getUTCFullYear() - startDate.getUTCFullYear()) * 12 +
				event.date.getUTCMonth() -
				startDate.getUTCMonth()
			months[index].totals[event.categoryId] += Math.abs(event.amount)
		}

		return {
			success: true,
			data: {
				categories: categoryIds.flatMap((id) =>
					categories.filter((category) => category.id === id),
				),
				months,
			},
		}
	} catch (error) {
		console.error("Failed to get category history:", error)
		return {
			success: false,
			error: "Não foi possível carregar o histórico das categorias",
		}
	}
}
