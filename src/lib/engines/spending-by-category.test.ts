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
				count: 2,
				categories: [
					{ name: "Fase de obra", amount: 130000, count: 1 },
					{ name: "Financiamento", amount: 53544, count: 1 },
				],
			},
			{
				iconKey: "food",
				total: 1250,
				count: 1,
				categories: [{ name: "Lanches", amount: 1250, count: 1 }],
			},
		])
	})

	it("separates card invoices, debts, and taxes", () => {
		const result = buildSpendingByCategoryReport([
			{
				description: "Fatura do cartão",
				amount: -330000,
				categoryName: "Cartão Bradesco",
			},
			{
				description: "Pagamento 1/12 - Empréstimo",
				amount: -140000,
				categoryName: "Empréstimos",
				categoryGroupId: "debts",
			},
			{
				description: "Imposto de renda",
				amount: -22998,
				categoryName: "Impostos",
			},
		])

		expect(result).toEqual([
			{
				iconKey: "card",
				total: 330000,
				count: 1,
				categories: [{ name: "Cartão Bradesco", amount: 330000, count: 1 }],
			},
			{
				iconKey: "debt",
				total: 140000,
				count: 1,
				categories: [{ name: "Empréstimos", amount: 140000, count: 1 }],
			},
			{
				iconKey: "tax",
				total: 22998,
				count: 1,
				categories: [{ name: "Impostos", amount: 22998, count: 1 }],
			},
		])
	})

	it("conta lançamentos repetidos na mesma categoria", () => {
		const result = buildSpendingByCategoryReport([
			{ description: "Uber", amount: -1800, categoryName: "Transporte" },
			{ description: "Uber", amount: -2200, categoryName: "Transporte" },
			{ description: "99", amount: -1500, categoryName: "Transporte" },
		])

		expect(result).toEqual([
			{
				iconKey: "transport",
				total: 5500,
				count: 3,
				categories: [{ name: "Transporte", amount: 5500, count: 3 }],
			},
		])
	})
})
