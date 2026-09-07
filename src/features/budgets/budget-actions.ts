"use server"

import { Prisma } from "@prisma/client"
import prisma from "@/lib/db"
import { getUserBySession } from "@/lib/auth"
import { dollarsToCents } from "@/types/finance"
import {
	buildBudgetReport,
	type BudgetReport,
} from "@/lib/engines/budget-report"

export type BudgetWithItems = Prisma.BudgetGetPayload<{
	include: {
		items: { include: { category: { include: { categoryGroup: true } } } }
	}
}>

export type BudgetResult =
	| { success: true; budget: BudgetWithItems | null }
	| { success: false; error: string }

function isValidPeriod(year: number, month: number) {
	return (
		Number.isInteger(year) &&
		year >= 2000 &&
		year <= 2100 &&
		Number.isInteger(month) &&
		month >= 1 &&
		month <= 12
	)
}

const budgetInclude = {
	items: {
		include: { category: { include: { categoryGroup: true } } },
		orderBy: { category: { name: "asc" } },
	},
} as const

export async function getBudget(
	year: number,
	month: number,
): Promise<BudgetResult> {
	try {
		const user = await getUserBySession()
		if (!user) return { success: false, error: "Não autenticado" }
		if (!isValidPeriod(year, month))
			return { success: false, error: "Período inválido" }
		const budget = await prisma.budget.findUnique({
			where: { userId_year_month: { userId: user.id, year, month } },
			include: budgetInclude,
		})
		return { success: true, budget }
	} catch (error) {
		console.error("Failed to fetch budget:", error)
		return { success: false, error: "Não foi possível carregar o orçamento" }
	}
}

export async function createBudget(
	year: number,
	month: number,
	copyPrevious: boolean,
): Promise<BudgetResult> {
	try {
		const user = await getUserBySession()
		if (!user) return { success: false, error: "Não autenticado" }
		if (!isValidPeriod(year, month))
			return { success: false, error: "Período inválido" }
		const previousYear = month === 1 ? year - 1 : year
		const previousMonth = month === 1 ? 12 : month - 1
		const previous = copyPrevious
			? await prisma.budget.findUnique({
					where: {
						userId_year_month: {
							userId: user.id,
							year: previousYear,
							month: previousMonth,
						},
					},
					select: { items: { select: { categoryId: true, amount: true } } },
				})
			: null
		const budget = await prisma.budget.create({
			data: {
				userId: user.id,
				year,
				month,
				items: previous ? { createMany: { data: previous.items } } : undefined,
			},
			include: budgetInclude,
		})
		return { success: true, budget }
	} catch (error) {
		if (
			error instanceof Prisma.PrismaClientKnownRequestError &&
			error.code === "P2002"
		) {
			return { success: false, error: "Já existe um orçamento para este mês" }
		}
		console.error("Failed to create budget:", error)
		return { success: false, error: "Não foi possível criar o orçamento" }
	}
}

export async function saveBudgetItem(
	budgetId: string,
	categoryId: string,
	amount: number,
) {
	try {
		const user = await getUserBySession()
		if (!user) return { success: false, error: "Não autenticado" } as const
		const amountCents = dollarsToCents(amount)
		if (!Number.isFinite(amountCents) || amountCents <= 0)
			return {
				success: false,
				error: "Informe um valor maior que zero",
			} as const
		const [budget, category] = await Promise.all([
			prisma.budget.findFirst({
				where: { id: budgetId, userId: user.id },
				select: { id: true },
			}),
			prisma.category.findFirst({
				where: { id: categoryId, userId: user.id },
				select: { id: true },
			}),
		])
		if (!budget || !category)
			return {
				success: false,
				error: "Orçamento ou categoria inválidos",
			} as const
		await prisma.budgetItem.upsert({
			where: { budgetId_categoryId: { budgetId, categoryId } },
			create: { budgetId, categoryId, amount: amountCents },
			update: { amount: amountCents },
		})
		return { success: true } as const
	} catch (error) {
		console.error("Failed to save budget item:", error)
		return { success: false, error: "Não foi possível salvar o valor" } as const
	}
}

export async function saveBudgetItems(
	budgetId: string,
	items: Array<{ categoryId: string; amount: number }>,
) {
	try {
		const user = await getUserBySession()
		if (!user) return { success: false, error: "Não autenticado" } as const
		const budget = await prisma.budget.findFirst({
			where: { id: budgetId, userId: user.id },
			select: { id: true },
		})
		if (!budget) return { success: false, error: "Orçamento inválido" } as const

		const normalizedItemsByCategory = new Map<string, number>()
		for (const item of items) {
			const amount = dollarsToCents(item.amount)
			if (item.categoryId && Number.isFinite(amount)) {
				normalizedItemsByCategory.set(item.categoryId, amount)
			}
		}
		const normalizedItems = Array.from(
			normalizedItemsByCategory,
			([categoryId, amount]) => ({ categoryId, amount }),
		)
		const categoryIds = [
			...new Set(normalizedItems.map((item) => item.categoryId)),
		]
		const categories = await prisma.category.findMany({
			where: { userId: user.id, id: { in: categoryIds } },
			select: { id: true },
		})
		if (categories.length !== categoryIds.length) {
			return { success: false, error: "Categoria inválida" } as const
		}

		const itemsToDelete = normalizedItems.filter((item) => item.amount <= 0)
		if (itemsToDelete.length > 0) {
			await prisma.budgetItem.deleteMany({
				where: {
					budgetId: budget.id,
					categoryId: { in: itemsToDelete.map((item) => item.categoryId) },
				},
			})
		}

		const itemsToSave = normalizedItems.filter((item) => item.amount > 0)
		for (let index = 0; index < itemsToSave.length; index += 25) {
			const batch = itemsToSave.slice(index, index + 25)
			await prisma.$transaction(
				batch.map((item) =>
					prisma.budgetItem.upsert({
						where: {
							budgetId_categoryId: {
								budgetId: budget.id,
								categoryId: item.categoryId,
							},
						},
						create: {
							budgetId: budget.id,
							categoryId: item.categoryId,
							amount: item.amount,
						},
						update: { amount: item.amount },
					}),
				),
			)
		}
		return { success: true } as const
	} catch (error) {
		console.error("Failed to save budget items:", error)
		return {
			success: false,
			error: "Não foi possível salvar o orçamento",
		} as const
	}
}

export async function deleteBudgetItem(budgetItemId: string) {
	try {
		const user = await getUserBySession()
		if (!user) return { success: false, error: "Não autenticado" } as const
		const item = await prisma.budgetItem.findFirst({
			where: { id: budgetItemId, budget: { userId: user.id } },
			select: { id: true },
		})
		if (!item)
			return {
				success: false,
				error: "Item de orçamento não encontrado",
			} as const
		await prisma.budgetItem.delete({ where: { id: item.id } })
		return { success: true } as const
	} catch (error) {
		console.error("Failed to delete budget item:", error)
		return { success: false, error: "Não foi possível remover o item" } as const
	}
}

export async function getBudgetReport(
	year: number,
	month: number,
): Promise<
	| { success: true; report: BudgetReport | null }
	| { success: false; error: string }
> {
	const budgetResult = await getBudget(year, month)
	if (!budgetResult.success) return budgetResult
	if (!budgetResult.budget) return { success: true, report: null }
	try {
		const user = await getUserBySession()
		if (!user) return { success: false, error: "Não autenticado" }
		const startDate = new Date(Date.UTC(year, month - 1, 1))
		const endDate = new Date(Date.UTC(year, month, 1))
		const events = await prisma.event.findMany({
			where: {
				userId: user.id,
				status: "CONFIRMED",
				date: { gte: startDate, lt: endDate },
				categoryId: { not: null },
			},
			select: {
				categoryId: true,
				amount: true,
				status: true,
				category: {
					select: {
						name: true,
						categoryGroup: { select: { name: true, type: true } },
					},
				},
			},
		})
		return {
			success: true,
			report: buildBudgetReport({
				items: budgetResult.budget.items.map((item) => ({
					categoryId: item.categoryId,
					categoryName: item.category.name,
					groupName: item.category.categoryGroup.name,
					groupType: item.category.categoryGroup.type,
					amount: item.amount,
				})),
				events: events.map((event) => ({
					categoryId: event.categoryId,
					amount: event.amount,
					status: event.status,
					categoryName: event.category?.name,
					groupName: event.category?.categoryGroup.name,
					groupType: event.category?.categoryGroup.type,
				})),
			}),
		}
	} catch (error) {
		console.error("Failed to build budget report:", error)
		return { success: false, error: "Não foi possível carregar o relatório" }
	}
}
