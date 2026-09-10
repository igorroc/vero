"use server"

import prisma from "@/lib/db"
import { getUserBySession } from "@/lib/auth"
import {
	getAccountBalances,
	type AccountWithBalance,
} from "@/features/accounts"
import { getEventsWithProjection } from "@/features/events"
import {
	calculateSpendingLimitAuto,
	type SpendingLimitResult,
} from "@/lib/engines/spending-limit"
import { getBudgetReport } from "@/features/budgets"
import {
	buildBudgetInsight,
	type BudgetInsight,
} from "@/lib/engines/budget-report"
import {
	buildCashflowProjection,
	getProjectionSummary,
	findCriticalEvents,
	projectPlannedAccountBalances,
	simulatePriorityScenarios,
} from "@/lib/engines/cashflow"
import type {
	Cents,
	CashflowEvent,
	HorizonMode,
	PrioritySimulationResult,
} from "@/types/finance"
import { addDays, endOfMonth, startOfDay } from "@/types/finance"

export interface DashboardData {
	// Balance info
	availableBalance: Cents
	accounts: AccountWithBalance[]
	monthlyBudget: {
		income: { budgeted: Cents; actual: Cents }
		outgoing: { budgeted: Cents; actual: Cents }
		insight: BudgetInsight
	} | null

	// Spending limit
	spendingLimit: SpendingLimitResult
	monthEndBalances: {
		available: Cents
		investments: Cents
	}

	// Upcoming events (next 7 days)
	upcomingEvents: Array<{
		id: string
		description: string
		amount: Cents
		date: Date
		type: string
		status: string
	}>

	// Projection summary (30 days)
	projectionSummary: {
		startingBalance: Cents
		endingBalance: Cents
		netChange: Cents
		avgDailySpend: Cents
		daysUntilNegative: number | null
	}

	// Critical events (events causing negative balance)
	criticalEvents: CashflowEvent[]

	// Priority simulation (what if OPTIONAL events are postponed)
	prioritySimulation: PrioritySimulationResult | null

	// User settings
	horizonMode: HorizonMode
	safetyBuffer: Cents
}

export type GetDashboardDataResult =
	{ success: true; data: DashboardData } | { success: false; error: string }

export async function getDashboardData(): Promise<GetDashboardDataResult> {
	try {
		const user = await getUserBySession()
		if (!user) {
			return { success: false, error: "Not authenticated" }
		}

		// Get user settings
		let settings = await prisma.userSettings.findUnique({
			where: { userId: user.id },
		})

		// Create default settings if not exist
		if (!settings) {
			settings = await prisma.userSettings.create({
				data: {
					userId: user.id,
					safetyBuffer: 0,
					horizonMode: "END_OF_MONTH",
				},
			})
		}

		const today = new Date()
		const monthEnd = endOfMonth(today)
		const [balancesResult, budgetResult] = await Promise.all([
			getAccountBalances(),
			getBudgetReport(today.getFullYear(), today.getMonth() + 1),
		])
		if (!balancesResult.success) {
			return { success: false, error: balancesResult.error }
		}

		const { accounts } = balancesResult
		const availableBalance = accounts
			.filter((account) => account.type !== "INVESTMENT")
			.reduce((total, account) => total + account.currentBalance, 0)
		const monthlyBudget =
			budgetResult.success && budgetResult.report
				? {
						income: budgetResult.report.income,
						outgoing: budgetResult.report.outgoing,
						insight: buildBudgetInsight(budgetResult.report),
					}
				: null

		// Get events for projection (next 90 days)
		const projectionEnd = addDays(today, 90)

		const eventsResult = await getEventsWithProjection(today, projectionEnd)
		if (!eventsResult.success) {
			return { success: false, error: eventsResult.error }
		}
		const debtInstallments = await prisma.debtInstallment.findMany({
			where: {
				debt: { userId: user.id, status: "ACTIVE" },
				dueDate: { gte: startOfDay(today), lte: projectionEnd },
				plannedAmount: { gt: 0 },
			},
			include: { debt: { select: { creditor: true } } },
		})
		const monthlyDebtInstallments = debtInstallments.filter(
			(installment) =>
				startOfDay(installment.dueDate).getTime() <= monthEnd.getTime(),
		)
		const monthlyEvents = eventsResult.events.filter(
			(event) =>
				startOfDay(event.date).getTime() >= startOfDay(today).getTime() &&
				startOfDay(event.date).getTime() <= monthEnd.getTime(),
		)

		// Map events for spending limit calculation
		const eventsForCalculation = monthlyEvents
			.map((e) => ({
				amount: e.amount,
				type: e.type,
				status: e.status,
				priority: e.priority,
				date: e.date,
			}))
			.concat(
				monthlyDebtInstallments.map((installment) => ({
					amount: -installment.plannedAmount,
					type: "EXPENSE" as const,
					status: "PLANNED" as const,
					priority: "REQUIRED" as const,
					date: installment.dueDate,
				})),
			)
		const projectedAccountBalances = projectPlannedAccountBalances(
			accounts.map((account) => ({
				id: account.id,
				name: account.name,
				initialBalance: account.currentBalance,
			})),
			monthlyEvents
				.filter((event) => event.status === "PLANNED")
				.map((event) => ({
					id: event.id,
					description: event.description,
					amount: event.amount,
					type: event.type,
					costType: event.costType,
					status: event.status,
					priority: event.priority,
					date: event.date,
					accountId: event.accountId,
					destinationAccountId: event.destinationAccountId,
				})),
		)
		const monthEndBalances = accounts.reduce(
			(totals, account) => {
				const projectedBalance =
					projectedAccountBalances.get(account.id) ?? account.currentBalance
				if (account.type === "INVESTMENT") {
					totals.investments += projectedBalance
				} else {
					totals.available += projectedBalance
				}
				return totals
			},
			{
				available: -monthlyDebtInstallments.reduce(
					(total, installment) => total + installment.plannedAmount,
					0,
				),
				investments: 0,
			},
		)

		// Calculate spending limit
		const spendingLimit = calculateSpendingLimitAuto(
			availableBalance,
			eventsForCalculation,
			settings.horizonMode,
			settings.safetyBuffer,
			today,
		)

		// Upcoming events start tomorrow; events due today belong to today's activity.
		const upcomingStart = addDays(startOfDay(today), 1)
		const upcomingEnd = addDays(startOfDay(today), 7)
		const upcomingEvents = eventsResult.events
			.filter(
				(e) =>
					startOfDay(e.date).getTime() >= upcomingStart.getTime() &&
					startOfDay(e.date).getTime() <= upcomingEnd.getTime() &&
					e.status !== "SKIPPED",
			)
			.map((e) => ({
				id: e.id,
				description: e.description,
				amount: e.amount,
				date: e.date,
				type: e.type,
				status: e.status,
			}))
			.concat(
				debtInstallments
					.filter(
						(installment) =>
							startOfDay(installment.dueDate).getTime() >=
								upcomingStart.getTime() &&
							startOfDay(installment.dueDate).getTime() <=
								startOfDay(upcomingEnd).getTime(),
					)
					.map((installment) => ({
						id: `debt-${installment.id}`,
						description: `Parcela de dívida - ${installment.debt.creditor}`,
						amount: -installment.plannedAmount,
						date: installment.dueDate,
						type: "EXPENSE",
						status: "PLANNED",
					})),
			)
			.sort((a, b) => a.date.getTime() - b.date.getTime())

		// Build cashflow projection input
		const cashflowInput = {
			accounts: [
				...accounts.map((a) => ({
					id: a.id,
					name: a.name,
					initialBalance: a.currentBalance, // Use current balance as starting point
				})),
				{
					id: "debt-projection",
					name: "Dívidas (conta a definir)",
					initialBalance: 0,
				},
			],
			events: eventsResult.events
				.filter((e) => e.status !== "SKIPPED")
				.map((e) => ({
					id: e.id,
					description: e.description,
					amount: e.amount,
					type: e.type,
					costType: e.costType,
					status: e.status,
					priority: e.priority,
					date: e.date,
					accountId: e.accountId,
					destinationAccountId: e.destinationAccountId,
				}))
				.concat(
					debtInstallments.map((installment) => ({
						id: `debt-${installment.id}`,
						description: `Parcela de dívida - ${installment.debt.creditor}`,
						amount: -installment.plannedAmount,
						type: "EXPENSE" as const,
						costType: "RECURRENT" as const,
						status: "PLANNED" as const,
						priority: "REQUIRED" as const,
						date: installment.dueDate,
						accountId: "debt-projection",
						destinationAccountId: null,
					})),
				),
			startDate: today,
			endDate: addDays(today, 30),
			safetyBuffer: settings.safetyBuffer,
		}

		// Build cashflow projection for summary
		const projection = buildCashflowProjection(cashflowInput)
		const projectionSummary = getProjectionSummary(projection)
		const criticalEvents = findCriticalEvents(projection)

		// Run priority simulation only if there are negative days
		let prioritySimulation: PrioritySimulationResult | null = null
		if (projection.negativeDays > 0) {
			prioritySimulation = simulatePriorityScenarios(cashflowInput)
		}

		return {
			success: true,
			data: {
				availableBalance,
				accounts,
				monthlyBudget,
				spendingLimit,
				monthEndBalances,
				upcomingEvents,
				projectionSummary,
				criticalEvents,
				prioritySimulation,
				horizonMode: settings.horizonMode,
				safetyBuffer: settings.safetyBuffer,
			},
		}
	} catch (error) {
		console.error("Failed to get dashboard data:", error)
		return { success: false, error: "Failed to load dashboard" }
	}
}
