"use server"

import prisma from "@/lib/db"
import { getUserBySession } from "@/lib/auth"
import {
	buildSpendingByCategoryReport,
	type SpendingIconGroup,
} from "@/lib/engines/spending-by-category"

export type GetCurrentSpendingByCategoryResult =
	| { success: true; groups: SpendingIconGroup[] }
	| { success: false; error: string }

export async function getCurrentSpendingByCategory(): Promise<GetCurrentSpendingByCategoryResult> {
	try {
		const user = await getUserBySession()
		if (!user) return { success: false, error: "Não autenticado" }

		const now = new Date()
		const startDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1))
		const endDate = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 1))
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
				category: { select: { name: true } },
			},
		})

		return {
			success: true,
			groups: buildSpendingByCategoryReport(
				events.map((event) => ({
					description: event.description,
					amount: event.amount,
					categoryName: event.category?.name ?? null,
				})),
			),
		}
	} catch (error) {
		console.error("Failed to get current spending by category:", error)
		return { success: false, error: "Não foi possível carregar os gastos" }
	}
}
