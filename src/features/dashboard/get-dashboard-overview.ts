"use server"

import { getUserBySession } from "@/lib/auth"
import { getBudgetReport } from "@/features/budgets/budget-actions"
import { getEvents } from "@/features/events/get-events"
import { getCategories } from "@/features/categories/get-categories"
import { getDebts } from "@/features/debts/debt-actions"
import { getNetWorthGoal } from "@/features/goals/net-worth-goal"
import { getAccountBalances } from "@/features/accounts/get-account-balances"
import {
	buildBudgetReport,
	type BudgetReportGroup,
} from "@/lib/engines/budget-report"
import type { Cents } from "@/types/finance"

export interface DashboardOverviewGoal {
	id: string
	name: string
	currentCents: Cents
	targetCents: Cents
	href: string
}

export interface DashboardOverview {
	year: number
	month: number
	hasBudget: boolean
	income: { budgeted: Cents; actual: Cents }
	outgoing: { budgeted: Cents; actual: Cents }
	groups: BudgetReportGroup[]
	goals: DashboardOverviewGoal[]
}

export type GetDashboardOverviewResult =
	{ success: true; data: DashboardOverview } | { success: false; error: string }

export async function getDashboardOverview(
	year: number,
	month: number,
): Promise<GetDashboardOverviewResult> {
	try {
		const user = await getUserBySession()
		if (!user) return { success: false, error: "Não autenticado" }
		if (
			!Number.isInteger(year) ||
			year < 2000 ||
			year > 2100 ||
			!Number.isInteger(month) ||
			month < 1 ||
			month > 12
		) {
			return { success: false, error: "Período inválido" }
		}

		const startDate = new Date(Date.UTC(year, month - 1, 1))
		const endDate = new Date(Date.UTC(year, month, 1))
		const [budgetResult, goalResult, eventsResult, debtsResult] =
			await Promise.all([
				getBudgetReport(year, month),
				getNetWorthGoal(),
				getEvents({
					startDate: new Date(Date.UTC(year, month - 1, 0)),
					endDate,
				}),
				getDebts(),
			])
		if (!budgetResult.success) return budgetResult
		if (!goalResult.success) return goalResult
		if (!eventsResult.success) return eventsResult
		if (!debtsResult.success) return debtsResult
		const events = eventsResult.events.filter(
			(event) =>
				event.date >= startDate &&
				event.date < endDate &&
				event.status === "CONFIRMED" &&
				event.type !== "TRANSFER",
		)

		let report = budgetResult.report
		const hasBudget = report !== null
		if (!report) {
			const categoriesResult = await getCategories()
			if (!categoriesResult.success) return categoriesResult
			const categories = new Map(
				categoriesResult.categories.map((category) => [category.id, category]),
			)
			report = buildBudgetReport({
				items: [],
				events: events.map((event) => {
					const category = event.categoryId
						? categories.get(event.categoryId)
						: undefined
					return {
						categoryId: category?.id ?? null,
						amount: event.amount,
						status: event.status,
						categoryName: category?.name,
						groupName: category?.categoryGroup.name,
						groupType: category?.categoryGroup.type,
					}
				}),
			})
		}
		const incomeActual = events.reduce(
			(total, event) =>
				total +
				(event.type === "INCOME" && event.amount > 0 ? event.amount : 0),
			0,
		)
		const outgoingActual = events.reduce(
			(total, event) =>
				total +
				((event.type === "EXPENSE" || event.type === "INVESTMENT") &&
				event.amount < 0
					? -event.amount
					: 0),
			0,
		)

		const goals: DashboardOverviewGoal[] = debtsResult.debts
			.filter((debt) => debt.status !== "CANCELED")
			.map((debt) => ({
				id: debt.id,
				name: debt.creditor,
				currentCents: debt.totalAmount - debt.outstandingAmount,
				targetCents: debt.totalAmount,
				href: `/debts/${debt.id}`,
			}))
		if (goalResult.goal) {
			const balancesResult = await getAccountBalances()
			if (!balancesResult.success) return balancesResult
			goals.push({
				id: goalResult.goal.id,
				name: "Patrimônio líquido",
				currentCents: balancesResult.totalBalance,
				targetCents: goalResult.goal.targetAmount,
				href: "/investments",
			})
		}

		return {
			success: true,
			data: {
				year,
				month,
				hasBudget,
				income: { ...report.income, actual: incomeActual },
				outgoing: { ...report.outgoing, actual: outgoingActual },
				groups: report.groups,
				goals,
			},
		}
	} catch (error) {
		console.error("Failed to get dashboard overview:", error)
		return { success: false, error: "Não foi possível carregar a visão geral" }
	}
}
