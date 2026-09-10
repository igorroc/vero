import { describe, expect, it } from "vitest"
import { buildSpendingByCategoryReport } from "./spending-by-category"

describe("buildSpendingByCategoryReport", () => {
	it("groups confirmed expense inputs by icon and category", () => {
		const result = buildSpendingByCategoryReport([
			{
				description: "Evolução de obra Caixa",
				amount: -130000,
				categoryName: "Fase de obra",
			},
			{
				description: "SSN",
				amount: -53544,
				categoryName: "Financiamento",
			},
			{
				description: "Salgado",
				amount: -1250,
				categoryName: "Lanches",
			},
			{
				description: "Estorno",
				amount: 1250,
				categoryName: "Lanches",
			},
		])

		expect(result).toEqual([
			{
				iconKey: "property",
				total: 183544,
				categories: [
					{ name: "Fase de obra", amount: 130000 },
					{ name: "Financiamento", amount: 53544 },
				],
			},
			{
				iconKey: "food",
				total: 1250,
				categories: [{ name: "Lanches", amount: 1250 }],
			},
		])
	})
})
