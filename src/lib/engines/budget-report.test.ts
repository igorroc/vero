import { describe, expect, it } from "vitest"
import {
	buildBudgetInsight,
	buildBudgetReport,
	calculateBudgetPlanAdjustment,
} from "./budget-report"

describe("buildBudgetReport", () => {
	it("consolida apenas eventos confirmados e calcula a distribuicao das saidas", () => {
		const result = buildBudgetReport({
			items: [
				{
					categoryId: "salary",
					categoryName: "Salario",
					groupName: "Renda fixa",
					groupType: "INCOME",
					amount: 500000,
				},
				{
					categoryId: "rent",
					categoryName: "Aluguel",
					groupName: "Moradia",
					groupType: "ESSENTIAL",
					amount: 200000,
				},
				{
					categoryId: "leisure",
					categoryName: "Cinema",
					groupName: "Lazer",
					groupType: "LIFESTYLE",
					amount: 100000,
				},
				{
					categoryId: "invest",
					categoryName: "Aporte",
					groupName: "Metas",
					groupType: "INVESTMENT",
					amount: 100000,
				},
			],
			events: [
				{ categoryId: "salary", amount: 500000, status: "CONFIRMED" },
				{ categoryId: "rent", amount: -150000, status: "CONFIRMED" },
				{ categoryId: "leisure", amount: -100000, status: "PLANNED" },
				{ categoryId: "invest", amount: -100000, status: "CONFIRMED" },
				{
					categoryId: "extra",
					amount: -50000,
					status: "CONFIRMED",
					categoryName: "Remédio",
					groupName: "Saúde",
					groupType: "ESSENTIAL",
				},
			],
		})

		expect(result.income).toEqual({ budgeted: 500000, actual: 500000 })
		expect(result.outgoing).toEqual({ budgeted: 400000, actual: 300000 })
		expect(result.groups.map((group) => group.type)).toEqual([
			"INCOME",
			"ESSENTIAL",
			"ESSENTIAL",
			"LIFESTYLE",
			"INVESTMENT",
		])
		expect(result.distribution.ESSENTIAL).toEqual({
			budgeted: 50,
			actual: expect.closeTo(66.66666666666666),
		})
		expect(result.distribution.LIFESTYLE).toEqual({ budgeted: 25, actual: 0 })
		expect(result.distribution.INVESTMENT).toEqual({
			budgeted: 25,
			actual: expect.closeTo(33.33333333333333),
		})
		expect(result.allocation.ESSENTIAL).toEqual({
			target: 50,
			budgeted: 40,
			actual: 40,
		})
		expect(result.allocation.LIFESTYLE).toEqual({
			target: 30,
			budgeted: 20,
			actual: 0,
		})
		expect(result.allocation.INVESTMENT).toEqual({
			target: 20,
			budgeted: 20,
			actual: 20,
		})
		expect(buildBudgetInsight(result)).toMatchObject({ tone: "success" })
	})

	it("recomenda reducoes proporcionais quando as saidas superam as entradas", () => {
		expect(
			calculateBudgetPlanAdjustment(100000, {
				ESSENTIAL: 60000,
				LIFESTYLE: 40000,
				INVESTMENT: 30000,
			}),
		).toEqual({
			shortfall: 30000,
			reductions: {
				ESSENTIAL: 13846,
				LIFESTYLE: 9230,
				INVESTMENT: 6924,
			},
		})
	})
})
