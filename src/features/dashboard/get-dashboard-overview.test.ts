import { beforeEach, describe, expect, it, vi } from "vitest"
import { buildBudgetReport } from "@/lib/engines/budget-report"

const mocks = vi.hoisted(() => ({
	auth: vi.fn(),
	budget: vi.fn(),
	events: vi.fn(),
	categories: vi.fn(),
	goal: vi.fn(),
	balances: vi.fn(),
	debts: vi.fn(),
}))

vi.mock("@/features/debts/debt-actions", () => ({ getDebts: mocks.debts }))
vi.mock("@/lib/auth", () => ({ getUserBySession: mocks.auth }))
vi.mock("@/features/budgets/budget-actions", () => ({
	getBudgetReport: mocks.budget,
}))
vi.mock("@/features/events/get-events", () => ({ getEvents: mocks.events }))
vi.mock("@/features/categories/get-categories", () => ({
	getCategories: mocks.categories,
}))
vi.mock("@/features/goals/net-worth-goal", () => ({
	getNetWorthGoal: mocks.goal,
}))
vi.mock("@/features/accounts/get-account-balances", () => ({
	getAccountBalances: mocks.balances,
}))

import { getDashboardOverview } from "./get-dashboard-overview"

beforeEach(() => {
	vi.resetAllMocks()
	mocks.auth.mockResolvedValue({ id: "user-1" })
	mocks.budget.mockResolvedValue({ success: true, report: null })
	mocks.goal.mockResolvedValue({ success: true, goal: null })
	mocks.debts.mockResolvedValue({ success: true, debts: [] })
	mocks.events.mockResolvedValue({ success: true, events: [] })
	mocks.categories.mockResolvedValue({ success: true, categories: [] })
})

describe("getDashboardOverview", () => {
	it("requires a session before reading financial data", async () => {
		mocks.auth.mockResolvedValue(null)
		expect(await getDashboardOverview(2026, 11)).toEqual({
			success: false,
			error: "Não autenticado",
		})
		expect(mocks.budget).not.toHaveBeenCalled()
		expect(mocks.debts).not.toHaveBeenCalled()
	})

	it.each([
		[2026, 0],
		[2026, 13],
		[2026, 1.5],
		[1999, 1],
		[2101, 1],
		[NaN, 1],
		[2026.5, 1],
		[2026, Infinity],
	])(
		"rejects invalid period %s/%s before loading data",
		async (year, month) => {
			expect(await getDashboardOverview(year, month)).toEqual({
				success: false,
				error: "Período inválido",
			})
			expect(mocks.budget).not.toHaveBeenCalled()
		},
	)

	it("preserves budget engine totals, grouping and differences", async () => {
		const report = buildBudgetReport({
			items: [
				{
					categoryId: "food",
					categoryName: "Food",
					groupName: "Essentials",
					groupType: "ESSENTIAL",
					amount: 10001,
				},
			],
			events: [{ categoryId: "food", amount: -2003, status: "CONFIRMED" }],
		})
		mocks.budget.mockResolvedValue({ success: true, report })
		mocks.events.mockResolvedValue({
			success: true,
			events: [
				{
					categoryId: "food",
					amount: -2003,
					status: "CONFIRMED",
					type: "EXPENSE",
					date: new Date("2026-11-15T12:00:00Z"),
				},
			],
		})
		const result = await getDashboardOverview(2026, 11)
		expect(mocks.budget).toHaveBeenCalledWith(2026, 11)
		expect(result).toEqual({
			success: true,
			data: {
				year: 2026,
				month: 11,
				hasBudget: true,
				income: report.income,
				outgoing: report.outgoing,
				groups: report.groups,
				goals: [],
			},
		})
		expect(report.groups[0].items[0].difference).toBe(7998)
		expect(mocks.events).toHaveBeenCalledWith({
			startDate: new Date("2026-10-31T00:00:00Z"),
			endDate: new Date("2026-12-01T00:00:00Z"),
		})
		expect(mocks.categories).not.toHaveBeenCalled()
	})

	it.each([false, true])(
		"includes uncategorized confirmed monthly actuals with hasBudget=%s",
		async (hasBudget) => {
			const report = buildBudgetReport({
				items: [
					{
						categoryId: "food",
						categoryName: "Food",
						groupName: "Essentials",
						groupType: "ESSENTIAL",
						amount: 10001,
					},
				],
				events: [{ categoryId: "food", amount: -3001, status: "CONFIRMED" }],
			})
			if (hasBudget) mocks.budget.mockResolvedValue({ success: true, report })
			mocks.categories.mockResolvedValue({
				success: true,
				categories: [
					{
						id: "food",
						name: "Food",
						categoryGroup: { name: "Essentials", type: "ESSENTIAL" },
					},
				],
			})
			const event = (amount: number, type: string, overrides = {}) => ({
				amount,
				type,
				status: "CONFIRMED",
				categoryId: null,
				date: new Date("2026-11-15T12:00:00Z"),
				...overrides,
			})
			mocks.events.mockResolvedValue({
				success: true,
				events: [
					event(20001, "INCOME"),
					event(-3001, "EXPENSE", { categoryId: "food" }),
					event(-1001, "EXPENSE"),
					event(-501, "INVESTMENT"),
					event(-999, "TRANSFER"),
					event(999, "INVESTMENT"),
					event(999, "TRANSFER"),
					event(-999, "INCOME"),
					event(999, "EXPENSE"),
					event(999, "INCOME", { status: "PLANNED" }),
					event(999, "INCOME", { status: "SKIPPED" }),
					event(-999, "EXPENSE", { status: "PLANNED" }),
					event(-999, "EXPENSE", { status: "SKIPPED" }),
					event(-999, "EXPENSE", { date: new Date("2026-10-31T23:59:59Z") }),
					event(-999, "EXPENSE", { date: new Date("2026-12-01T00:00:00Z") }),
				],
			})
			const result = await getDashboardOverview(2026, 11)
			expect(result.success).toBe(true)
			if (!result.success) return
			expect(result.data.hasBudget).toBe(hasBudget)
			expect(result.data.income).toEqual({ budgeted: 0, actual: 20001 })
			expect(result.data.outgoing).toEqual({
				budgeted: hasBudget ? 10001 : 0,
				actual: 4503,
			})
			expect(result.data.groups[0].items[0]).toMatchObject({
				categoryId: "food",
				budgeted: hasBudget ? 10001 : 0,
				actual: 3001,
				difference: hasBudget ? 7000 : -3001,
			})
			if (hasBudget) {
				expect(result.data.groups).toEqual(report.groups)
				expect(report.outgoing.actual).toBe(3001)
			}
			expect(result.data.goals).toEqual([])
			expect(mocks.balances).not.toHaveBeenCalled()
		},
	)

	it("returns only the supported net-worth goal with current total account balances", async () => {
		mocks.goal.mockResolvedValue({
			success: true,
			goal: { id: "goal-1", targetAmount: 100001 },
		})
		mocks.balances.mockResolvedValue({ success: true, totalBalance: -1234 })
		const result = await getDashboardOverview(2026, 11)
		expect(result.success && result.data.goals).toEqual([
			{
				id: "goal-1",
				name: "Patrimônio líquido",
				currentCents: -1234,
				targetCents: 100001,
				href: "/investments",
			},
		])
	})

	it("includes active and paid debts as payment goals, excluding canceled debts", async () => {
		mocks.debts.mockResolvedValue({
			success: true,
			debts: [
				{
					id: "partial",
					creditor: "Pai",
					totalAmount: 100001,
					outstandingAmount: 20001,
					status: "ACTIVE",
				},
				{
					id: "unpaid",
					creditor: "Banco",
					totalAmount: 50000,
					outstandingAmount: 50000,
					status: "ACTIVE",
				},
				{
					id: "paid",
					creditor: "Loja",
					totalAmount: 30000,
					outstandingAmount: 0,
					status: "PAID",
				},
				{
					id: "canceled",
					creditor: "Cancelada",
					totalAmount: 10000,
					outstandingAmount: 10000,
					status: "CANCELED",
				},
			],
		})
		mocks.goal.mockResolvedValue({
			success: true,
			goal: { id: "net-worth", targetAmount: 90000 },
		})
		mocks.balances.mockResolvedValue({ success: true, totalBalance: 10000 })
		const result = await getDashboardOverview(2026, 11)
		expect(result.success && result.data.goals).toEqual([
			{
				id: "partial",
				name: "Pai",
				currentCents: 80000,
				targetCents: 100001,
				href: "/debts/partial",
			},
			{
				id: "unpaid",
				name: "Banco",
				currentCents: 0,
				targetCents: 50000,
				href: "/debts/unpaid",
			},
			{
				id: "paid",
				name: "Loja",
				currentCents: 30000,
				targetCents: 30000,
				href: "/debts/paid",
			},
			{
				id: "net-worth",
				name: "Patrimônio líquido",
				currentCents: 10000,
				targetCents: 90000,
				href: "/investments",
			},
		])
	})

	it.each([
		"budget",
		"goal",
		"events",
		"categories",
		"balances",
		"debts",
	] as const)("propagates %s failures", async (source) => {
		if (source === "balances")
			mocks.goal.mockResolvedValue({
				success: true,
				goal: { id: "goal-1", targetAmount: 100 },
			})
		mocks[source].mockResolvedValue({ success: false, error: "Read failed" })
		expect(await getDashboardOverview(2026, 11)).toEqual({
			success: false,
			error: "Read failed",
		})
	})

	it("converts unexpected failures to the action error convention", async () => {
		const log = vi.spyOn(console, "error").mockImplementation(() => {})
		mocks.auth.mockRejectedValue(new Error("Unavailable"))
		expect(await getDashboardOverview(2026, 11)).toEqual({
			success: false,
			error: "Não foi possível carregar a visão geral",
		})
		log.mockRestore()
	})
})
