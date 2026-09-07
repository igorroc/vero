import type { Cents } from "@/types/finance"

export type BudgetGroupType =
	"INCOME" | "ESSENTIAL" | "LIFESTYLE" | "INVESTMENT"

export interface BudgetReportInput {
	items: Array<{
		categoryId: string
		categoryName: string
		groupName: string
		groupType: BudgetGroupType
		amount: Cents
	}>
	events: Array<{
		categoryId: string | null
		amount: Cents
		status: "CONFIRMED" | "PLANNED" | "SKIPPED"
		categoryName?: string
		groupName?: string
		groupType?: BudgetGroupType
	}>
}

export interface BudgetReportItem {
	categoryId: string
	categoryName: string
	budgeted: Cents
	actual: Cents
	difference: Cents
	executionPercent: number
}

export interface BudgetReportGroup {
	name: string
	type: BudgetGroupType
	items: BudgetReportItem[]
	budgeted: Cents
	actual: Cents
}

export interface BudgetReport {
	groups: BudgetReportGroup[]
	income: { budgeted: Cents; actual: Cents }
	outgoing: { budgeted: Cents; actual: Cents }
	allocation: Record<
		Exclude<BudgetGroupType, "INCOME">,
		{ target: number; budgeted: number; actual: number }
	>
	distribution: Record<
		Exclude<BudgetGroupType, "INCOME">,
		{ budgeted: number; actual: number }
	>
}

export interface BudgetInsight {
	tone: "success" | "warning" | "danger"
	message: string
}

export function buildBudgetReport(input: BudgetReportInput): BudgetReport {
	const actualByCategory = new Map<string, Cents>()
	const eventCategories = new Map<
		string,
		{ categoryName: string; groupName: string; groupType: BudgetGroupType }
	>()
	for (const event of input.events) {
		if (event.status !== "CONFIRMED" || !event.categoryId) continue
		actualByCategory.set(
			event.categoryId,
			(actualByCategory.get(event.categoryId) ?? 0) + Math.abs(event.amount),
		)
		if (event.categoryName && event.groupName && event.groupType) {
			eventCategories.set(event.categoryId, {
				categoryName: event.categoryName,
				groupName: event.groupName,
				groupType: event.groupType,
			})
		}
	}

	const groups = new Map<string, BudgetReportGroup>()
	for (const item of input.items) {
		const key = `${item.groupType}:${item.groupName}`
		const actual = actualByCategory.get(item.categoryId) ?? 0
		const reportItem: BudgetReportItem = {
			categoryId: item.categoryId,
			categoryName: item.categoryName,
			budgeted: item.amount,
			actual,
			difference: item.amount - actual,
			executionPercent: item.amount > 0 ? (actual / item.amount) * 100 : 0,
		}
		const group = groups.get(key) ?? {
			name: item.groupName,
			type: item.groupType,
			items: [],
			budgeted: 0,
			actual: 0,
		}
		group.items.push(reportItem)
		group.budgeted += item.amount
		group.actual += actual
		groups.set(key, group)
	}
	const budgetedCategoryIds = new Set(
		input.items.map((item) => item.categoryId),
	)
	for (const [categoryId, actual] of actualByCategory) {
		if (budgetedCategoryIds.has(categoryId)) continue
		const category = eventCategories.get(categoryId)
		if (!category) continue
		const key = `${category.groupType}:${category.groupName}`
		const group = groups.get(key) ?? {
			name: category.groupName,
			type: category.groupType,
			items: [],
			budgeted: 0,
			actual: 0,
		}
		group.items.push({
			categoryId,
			categoryName: category.categoryName,
			budgeted: 0,
			actual,
			difference: -actual,
			executionPercent: 0,
		})
		group.actual += actual
		groups.set(key, group)
	}

	const groupOrder: Record<BudgetGroupType, number> = {
		INCOME: 0,
		ESSENTIAL: 1,
		LIFESTYLE: 2,
		INVESTMENT: 3,
	}
	const reportGroups = Array.from(groups.values())
		.map((group) => ({
			...group,
			items: [...group.items].sort((a, b) =>
				a.categoryName.localeCompare(b.categoryName, "pt-BR"),
			),
		}))
		.sort(
			(a, b) =>
				groupOrder[a.type] - groupOrder[b.type] ||
				a.name.localeCompare(b.name, "pt-BR"),
		)
	const income = reportGroups
		.filter((group) => group.type === "INCOME")
		.reduce(
			(total, group) => ({
				budgeted: total.budgeted + group.budgeted,
				actual: total.actual + group.actual,
			}),
			{ budgeted: 0, actual: 0 },
		)
	const outgoing = reportGroups
		.filter((group) => group.type !== "INCOME")
		.reduce(
			(total, group) => ({
				budgeted: total.budgeted + group.budgeted,
				actual: total.actual + group.actual,
			}),
			{ budgeted: 0, actual: 0 },
		)
	const distribution = (
		["ESSENTIAL", "LIFESTYLE", "INVESTMENT"] as const
	).reduce(
		(result, type) => {
			const total = reportGroups
				.filter((group) => group.type === type)
				.reduce(
					(sum, group) => ({
						budgeted: sum.budgeted + group.budgeted,
						actual: sum.actual + group.actual,
					}),
					{ budgeted: 0, actual: 0 },
				)
			result[type] = {
				budgeted:
					outgoing.budgeted > 0
						? (total.budgeted / outgoing.budgeted) * 100
						: 0,
				actual:
					outgoing.actual > 0 ? (total.actual / outgoing.actual) * 100 : 0,
			}
			return result
		},
		{} as BudgetReport["distribution"],
	)
	const allocationTargets = {
		ESSENTIAL: 50,
		LIFESTYLE: 30,
		INVESTMENT: 20,
	} as const
	const allocation = (["ESSENTIAL", "LIFESTYLE", "INVESTMENT"] as const).reduce(
		(result, type) => {
			const total = reportGroups
				.filter((group) => group.type === type)
				.reduce(
					(sum, group) => ({
						budgeted: sum.budgeted + group.budgeted,
						actual: sum.actual + group.actual,
					}),
					{ budgeted: 0, actual: 0 },
				)
			result[type] = {
				target: allocationTargets[type],
				budgeted:
					income.budgeted > 0 ? (total.budgeted / income.budgeted) * 100 : 0,
				actual: income.actual > 0 ? (total.actual / income.actual) * 100 : 0,
			}
			return result
		},
		{} as BudgetReport["allocation"],
	)

	return { groups: reportGroups, income, outgoing, allocation, distribution }
}

export function buildBudgetInsight(report: BudgetReport): BudgetInsight {
	const exceededAllocation = (
		["ESSENTIAL", "LIFESTYLE", "INVESTMENT"] as const
	).find(
		(type) => report.allocation[type].actual > report.allocation[type].target,
	)
	if (exceededAllocation) {
		const labels = {
			ESSENTIAL: "Essencial",
			LIFESTYLE: "Estilo de vida",
			INVESTMENT: "Investimentos",
		}
		const allocation = report.allocation[exceededAllocation]
		return {
			tone: "warning",
			message: `${labels[exceededAllocation]} já representa ${allocation.actual.toFixed(1)}% das entradas realizadas. A meta é até ${allocation.target}%.`,
		}
	}

	if (report.outgoing.actual > report.outgoing.budgeted) {
		return {
			tone: "danger",
			message:
				"As saídas realizadas ultrapassaram o orçamento. Revise os grupos com maior diferença para ajustar o restante do mês.",
		}
	}

	if (
		report.income.budgeted > 0 &&
		report.income.actual < report.income.budgeted
	) {
		return {
			tone: "warning",
			message:
				"As receitas realizadas ainda estão abaixo do planejado. Evite antecipar gastos até confirmar as próximas entradas.",
		}
	}

	return {
		tone: "success",
		message:
			"O mês está dentro do orçamento até agora. Mantenha o ritmo e acompanhe os próximos eventos planejados.",
	}
}
