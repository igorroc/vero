import { describe, it, expect } from "vitest"
import type { SpendingIconGroup } from "./spending-by-category"
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
	const current: SpendingIconGroup[] = [
		{
			iconKey: "food",
			total: 30000,
			categories: [{ name: "Mercado", amount: 30000 }],
		},
		{
			iconKey: "housing",
			total: 50000,
			categories: [{ name: "Aluguel", amount: 50000 }],
		},
	]
	const previous: SpendingIconGroup[] = [
		{
			iconKey: "food",
			total: 30000,
			categories: [
				{ name: "Mercado", amount: 20000 },
				{ name: "Restaurante", amount: 10000 },
			],
		},
		{
			iconKey: "transport",
			total: 8000,
			categories: [{ name: "Uber", amount: 8000 }],
		},
	]

	it("compara categorias, incluindo as que saíram", () => {
		const result = buildSpendingComparison(current, previous)
		const food = result.find((group) => group.iconKey === "food")
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
		const housing = result.find((group) => group.iconKey === "housing")
		expect(housing).toMatchObject({
			currentTotal: 50000,
			previousTotal: 0,
		})
		expect(housing?.changePercent).toBeNull()

		const transport = result.find((group) => group.iconKey === "transport")
		expect(transport).toMatchObject({
			currentTotal: 0,
			previousTotal: 8000,
		})
		expect(transport?.changePercent).toBeCloseTo(-100)
	})

	it("ordena categorias por gasto atual e depois anterior", () => {
		const result = buildSpendingComparison(current, previous)
		const food = result.find((group) => group.iconKey === "food")
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
