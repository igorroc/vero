import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { buildBudgetReport } from "@/lib/engines/budget-report"

const mocks = vi.hoisted(() => ({
	auth: vi.fn(),
	categories: vi.fn(),
	events: vi.fn(),
}))

vi.mock("@/lib/auth", () => ({ getUserBySession: mocks.auth }))
vi.mock("@/lib/db", () => ({
	default: {
		category: { findMany: mocks.categories },
		event: { findMany: mocks.events },
	},
}))

import { getCategoryHistory } from "./get-category-history"

beforeEach(() => {
	vi.resetAllMocks()
	vi.useFakeTimers()
	vi.setSystemTime(new Date("2026-01-31T23:30:00Z"))
	mocks.auth.mockResolvedValue({ id: "user-1" })
	mocks.categories.mockResolvedValue([{ id: "food", name: "Food" }])
	mocks.events.mockResolvedValue([])
})

afterEach(() => {
	vi.useRealTimers()
	vi.restoreAllMocks()
})

describe("getCategoryHistory", () => {
	it("requires authentication before reading data", async () => {
		mocks.auth.mockResolvedValue(null)
		expect(await getCategoryHistory(["food"])).toEqual({
			success: false,
			error: "Não autenticado",
		})
		expect(mocks.categories).not.toHaveBeenCalled()
		expect(mocks.events).not.toHaveBeenCalled()
	})

	it.each([
		["food", "food"],
		["food", "rent", "salary", "travel"],
		[""],
		["   "],
	])("rejects invalid selections %j before querying", async (...ids) => {
		expect(await getCategoryHistory(ids)).toEqual({
			success: false,
			error: "Selecione até 3 categorias distintas",
		})
		expect(mocks.categories).not.toHaveBeenCalled()
		expect(mocks.events).not.toHaveBeenCalled()
	})

	it.each(["unknown", "other-users-category"])(
		"rejects %s without loading financial events",
		async (id) => {
			expect(await getCategoryHistory(["food", id])).toEqual({
				success: false,
				error: "Categorias inválidas",
			})
			expect(mocks.categories).toHaveBeenCalledWith({
				where: { userId: "user-1", id: { in: ["food", id] } },
				select: { id: true, name: true },
			})
			expect(mocks.events).not.toHaveBeenCalled()
		},
	)

	it("returns six UTC calendar months with zero-filled totals across a year boundary", async () => {
		expect(await getCategoryHistory(["food"])).toEqual({
			success: true,
			data: {
				categories: [{ id: "food", name: "Food" }],
				months: [
					{ month: "2025-08", totals: { food: 0 } },
					{ month: "2025-09", totals: { food: 0 } },
					{ month: "2025-10", totals: { food: 0 } },
					{ month: "2025-11", totals: { food: 0 } },
					{ month: "2025-12", totals: { food: 0 } },
					{ month: "2026-01", totals: { food: 0 } },
				],
			},
		})
		expect(mocks.events).toHaveBeenCalledWith({
			where: {
				userId: "user-1",
				categoryId: { in: ["food"] },
				status: "CONFIRMED",
				type: { not: "TRANSFER" },
				date: {
					gte: new Date("2025-08-01T00:00:00Z"),
					lt: new Date("2026-02-01T00:00:00Z"),
				},
			},
			select: { categoryId: true, amount: true, date: true },
		})
	})

	it("supports an empty selection without database queries", async () => {
		const result = await getCategoryHistory([])
		expect(result).toEqual({
			success: true,
			data: {
				categories: [],
				months: [
					"2025-08",
					"2025-09",
					"2025-10",
					"2025-11",
					"2025-12",
					"2026-01",
				].map((month) => ({ month, totals: {} })),
			},
		})
		expect(mocks.categories).not.toHaveBeenCalled()
		expect(mocks.events).not.toHaveBeenCalled()
	})

	it("accepts three categories and preserves selection order", async () => {
		mocks.categories.mockResolvedValue([
			{ id: "salary", name: "Salary" },
			{ id: "food", name: "Food" },
			{ id: "investment", name: "Investment" },
		])
		const result = await getCategoryHistory(["food", "investment", "salary"])
		expect(result.success).toBe(true)
		if (!result.success) return
		expect(result.data.categories.map(({ id }) => id)).toEqual([
			"food",
			"investment",
			"salary",
		])
		expect(
			result.data.months.every(
				({ totals }) =>
					Object.keys(totals).length === 3 &&
					Object.values(totals).every((total) => total === 0),
			),
		).toBe(true)
	})

	it("aggregates per-event magnitudes like report actuals and excludes non-confirmed, transfer and out-of-range events", async () => {
		const events = [
			{
				categoryId: "food",
				amount: -2003,
				status: "CONFIRMED",
				type: "EXPENSE",
				date: new Date("2025-08-01T00:00:00Z"),
				userId: "user-1",
			},
			{
				categoryId: "food",
				amount: 101,
				status: "CONFIRMED",
				type: "INCOME",
				date: new Date("2025-08-31T23:59:59.999Z"),
				userId: "user-1",
			},
			{
				categoryId: "food",
				amount: -333,
				status: "CONFIRMED",
				type: "INVESTMENT",
				date: new Date("2025-09-01T00:00:00Z"),
				userId: "user-1",
			},
			{
				categoryId: "food",
				amount: -17,
				status: "CONFIRMED",
				type: "EXPENSE",
				date: new Date("2026-01-31T23:59:59.999Z"),
				userId: "user-1",
			},
			{
				categoryId: "food",
				amount: -9000,
				status: "PLANNED",
				type: "EXPENSE",
				date: new Date("2025-08-02Z"),
				userId: "user-1",
			},
			{
				categoryId: "food",
				amount: -9000,
				status: "SKIPPED",
				type: "EXPENSE",
				date: new Date("2025-08-02Z"),
				userId: "user-1",
			},
			{
				categoryId: "food",
				amount: -9000,
				status: "CONFIRMED",
				type: "TRANSFER",
				date: new Date("2025-08-02Z"),
				userId: "user-1",
			},
			{
				categoryId: "food",
				amount: -9000,
				status: "CONFIRMED",
				type: "EXPENSE",
				date: new Date("2025-07-31T23:59:59.999Z"),
				userId: "user-1",
			},
			{
				categoryId: "food",
				amount: -9000,
				status: "CONFIRMED",
				type: "EXPENSE",
				date: new Date("2026-02-01T00:00:00Z"),
				userId: "user-1",
			},
			{
				categoryId: "food",
				amount: -9000,
				status: "CONFIRMED",
				type: "EXPENSE",
				date: new Date("2025-08-02Z"),
				userId: "user-2",
			},
			{
				categoryId: "other",
				amount: -9000,
				status: "CONFIRMED",
				type: "EXPENSE",
				date: new Date("2025-08-02Z"),
				userId: "user-1",
			},
		] as const
		mocks.events.mockImplementation(
			async ({
				where,
			}: {
				where: {
					userId: string
					categoryId: { in: string[] }
					status: string
					type: { not: string }
					date: { gte: Date; lt: Date }
				}
			}) =>
				events.filter(
					(event) =>
						event.userId === where.userId &&
						where.categoryId.in.includes(event.categoryId) &&
						event.status === where.status &&
						event.type !== where.type.not &&
						event.date >= where.date.gte &&
						event.date < where.date.lt,
				),
		)
		const result = await getCategoryHistory(["food"])
		expect(result.success).toBe(true)
		if (!result.success) return
		expect(result.data.months.map(({ totals }) => totals.food)).toEqual([
			2104, 333, 0, 0, 0, 17,
		])
		const report = buildBudgetReport({
			items: [
				{
					categoryId: "food",
					categoryName: "Food",
					groupName: "Essentials",
					groupType: "ESSENTIAL",
					amount: 0,
				},
			],
			events: events.slice(0, 2),
		})
		expect(result.data.months[0].totals.food).toBe(
			report.groups[0].items[0].actual,
		)
		expect(
			result.data.months.every(({ totals }) => Number.isInteger(totals.food)),
		).toBe(true)
	})

	it("anchors the window to the current UTC month at rollover", async () => {
		vi.setSystemTime(new Date("2026-03-01T00:30:00+02:00"))
		const result = await getCategoryHistory(["food"])
		expect(result.success).toBe(true)
		if (!result.success) return
		expect(result.data.months.map(({ month }) => month)).toEqual([
			"2025-09",
			"2025-10",
			"2025-11",
			"2025-12",
			"2026-01",
			"2026-02",
		])
	})

	it("returns a discriminated error on database failure", async () => {
		vi.spyOn(console, "error").mockImplementation(() => {})
		mocks.events.mockRejectedValue(new Error("Database unavailable"))
		expect(await getCategoryHistory(["food"])).toEqual({
			success: false,
			error: "Não foi possível carregar o histórico das categorias",
		})
	})
})
