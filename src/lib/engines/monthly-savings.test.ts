import { describe, expect, it } from "vitest"
import { buildMonthlySavings } from "./monthly-savings"

describe("buildMonthlySavings", () => {
	it("calcula economia total e caixa livre, tratando investimento como economia", () => {
		const result = buildMonthlySavings({
			previsto: { income: 500000, expense: 300000, investment: 100000 },
			realizado: { income: 500000, expense: 250000, investment: 100000 },
		})

		expect(result.previsto).toEqual({
			income: 500000,
			expense: 300000,
			investment: 100000,
			saved: 200000,
			freeCash: 100000,
			savingsRate: 40,
		})
		expect(result.realizado).toEqual({
			income: 500000,
			expense: 250000,
			investment: 100000,
			saved: 250000,
			freeCash: 150000,
			savingsRate: 50,
		})
	})

	it("calcula a diferença como realizado menos previsto", () => {
		const result = buildMonthlySavings({
			previsto: { income: 500000, expense: 300000, investment: 100000 },
			realizado: { income: 450000, expense: 320000, investment: 80000 },
		})

		expect(result.difference).toEqual({
			income: -50000,
			expense: 20000,
			investment: -20000,
			saved: -70000,
			freeCash: -50000,
		})
	})

	it("retorna taxa zero quando não há entradas", () => {
		const result = buildMonthlySavings({
			previsto: { income: 0, expense: 0, investment: 0 },
			realizado: { income: 0, expense: 1000, investment: 0 },
		})

		expect(result.realizado.savingsRate).toBe(0)
		expect(result.realizado.saved).toBe(-1000)
		expect(result.realizado.freeCash).toBe(-1000)
	})

	it("pode produzir caixa livre negativo mesmo com economia positiva", () => {
		const result = buildMonthlySavings({
			previsto: { income: 500000, expense: 100000, investment: 500000 },
			realizado: { income: 500000, expense: 100000, investment: 500000 },
		})

		expect(result.previsto.saved).toBe(400000)
		expect(result.previsto.freeCash).toBe(-100000)
	})
})
