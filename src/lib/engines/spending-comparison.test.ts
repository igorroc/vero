import { describe, it, expect } from "vitest"
import type { SpendingGroupSummary } from "./spending-by-category"
import {
	buildSpendingComparison,
	calculateChangePercent,
	getPreviousMonth,
} from "./spending-comparison"

describe("calculateChangePercent", () => {
	it("calcula aumento e redução", () => {
		expect(calculateChangePercent(30000, 20000)).toBeCloseTo(50)
		expect(calculateChangePercent(10000, 20000)).toBeCloseTo(-50)
	})

	it("retorna null quando não havia gasto anterior", () => {
		expect(calculateChangePercent(10000, 0)).toBeNull()
		expect(calculateChangePercent(0, 0)).toBe(0)
	})

	it("retorna -100 quando o gasto zera", () => {
		expect(calculateChangePercent(0, 10000)).toBeCloseTo(-100)
	})
})

describe("buildSpendingComparison", () => {
	const current: SpendingGroupSummary[] = [
		{
			key: "g-food",
			name: "Alimentação",
			type: "LIFESTYLE",
			iconKey: "food",
			total: 30000,
			count: 1,
			categories: [
				{ categoryId: "m", name: "Mercado", amount: 30000, count: 1 },
			],
		},
		{
			key: "g-house",
			name: "Moradia",
			type: "ESSENTIAL",
			iconKey: "housing",
			total: 50000,
			count: 1,
			categories: [
				{ categoryId: "a", name: "Aluguel", amount: 50000, count: 1 },
			],
		},
	]
	const previous: SpendingGroupSummary[] = [
		{
			key: "g-food",
			name: "Alimentação",
			type: "LIFESTYLE",
			iconKey: "food",
			total: 30000,
			count: 2,
			categories: [
				{ categoryId: "m", name: "Mercado", amount: 20000, count: 1 },
				{ categoryId: "r", name: "Restaurante", amount: 10000, count: 1 },
			],
		},
		{
			key: "g-transport",
			name: "Transporte",
			type: "LIFESTYLE",
			iconKey: "transport",
			total: 8000,
			count: 1,
			categories: [
				{ categoryId: "u", name: "Uber", amount: 8000, count: 1 },
			],
		},
	]

	it("compara categorias, incluindo as que saíram", () => {
		const result = buildSpendingComparison(current, previous)
		const food = result.find((group) => group.key === "g-food")
		expect(food?.name).toBe("Alimentação")
		expect(food?.currentTotal).toBe(30000)
		expect(food?.previousTotal).toBe(30000)
		expect(food?.changePercent).toBe(0)

		const mercado = food?.categories.find((item) => item.name === "Mercado")
		expect(mercado).toMatchObject({
			currentCents: 30000,
			previousCents: 20000,
			differenceCents: 10000,
		})
		expect(mercado?.changePercent).toBeCloseTo(50)

		const restaurante = food?.categories.find(
			(item) => item.name === "Restaurante",
		)
		expect(restaurante).toMatchObject({
			currentCents: 0,
			previousCents: 10000,
			differenceCents: -10000,
		})
		expect(restaurante?.changePercent).toBeCloseTo(-100)
	})

	it("inclui grupo novo (só no mês atual) e grupo que sumiu (só no anterior)", () => {
		const result = buildSpendingComparison(current, previous)
		const housing = result.find((group) => group.key === "g-house")
		expect(housing).toMatchObject({
			name: "Moradia",
			currentTotal: 50000,
			previousTotal: 0,
		})
		expect(housing?.changePercent).toBeNull()

		const transport = result.find((group) => group.key === "g-transport")
		expect(transport).toMatchObject({
			name: "Transporte",
			currentTotal: 0,
			previousTotal: 8000,
		})
		expect(transport?.changePercent).toBeCloseTo(-100)
	})

	it("ordena categorias por gasto atual e depois anterior", () => {
		const result = buildSpendingComparison(current, previous)
		const food = result.find((group) => group.key === "g-food")
		expect(food?.categories.map((item) => item.name)).toEqual([
			"Mercado",
			"Restaurante",
		])
	})
})

describe("getPreviousMonth", () => {
	it("volta um mês dentro do ano", () => {
		expect(getPreviousMonth(2026, 9)).toEqual({ year: 2026, month: 8 })
	})

	it("vira o ano em janeiro", () => {
		expect(getPreviousMonth(2026, 1)).toEqual({ year: 2025, month: 12 })
	})
})
