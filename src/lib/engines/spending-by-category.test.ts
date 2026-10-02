import { describe, expect, it } from "vitest"
import {
	buildSpendingByCategoryReport,
	type SpendingByCategoryInput,
} from "./spending-by-category"

function event(
	input: Partial<SpendingByCategoryInput> & { amount: number },
): SpendingByCategoryInput {
	return {
		categoryId: null,
		categoryName: null,
		categoryGroupId: null,
		categoryGroupName: null,
		categoryGroupType: null,
		...input,
	}
}

describe("buildSpendingByCategoryReport", () => {
	it("agrupa pelo grupo de categoria, não pela descrição", () => {
		const result = buildSpendingByCategoryReport([
			event({
				categoryId: "c1",
				categoryName: "Aluguel",
				categoryGroupId: "g-house",
				categoryGroupName: "Moradia",
				categoryGroupType: "ESSENTIAL",
				amount: -130000,
			}),
			event({
				categoryId: "c2",
				categoryName: "Financiamento",
				categoryGroupId: "g-house",
				categoryGroupName: "Moradia",
				categoryGroupType: "ESSENTIAL",
				amount: -53544,
			}),
			event({
				categoryId: "c3",
				categoryName: "Mercado",
				categoryGroupId: "g-food",
				categoryGroupName: "Alimentação",
				categoryGroupType: "LIFESTYLE",
				amount: -30000,
			}),
		])

		expect(result).toEqual([
			{
				key: "g-house",
				name: "Moradia",
				type: "ESSENTIAL",
				iconKey: "housing",
				total: 183544,
				count: 2,
				categories: [
					{ categoryId: "c1", name: "Aluguel", amount: 130000, count: 1 },
					{ categoryId: "c2", name: "Financiamento", amount: 53544, count: 1 },
				],
			},
			{
				key: "g-food",
				name: "Alimentação",
				type: "LIFESTYLE",
				iconKey: "food",
				total: 30000,
				count: 1,
				categories: [
					{ categoryId: "c3", name: "Mercado", amount: 30000, count: 1 },
				],
			},
		])
	})

	it("mantém categorias de mesmo nome separadas por grupo", () => {
		const result = buildSpendingByCategoryReport([
			event({
				categoryId: "t1",
				categoryName: "Telefone",
				categoryGroupId: "g-phone",
				categoryGroupName: "Telefone",
				categoryGroupType: "ESSENTIAL",
				amount: -20620,
			}),
			event({
				categoryId: "t2",
				categoryName: "Telefone",
				categoryGroupId: "g-services",
				categoryGroupName: "Serviços",
				categoryGroupType: "ESSENTIAL",
				amount: -3162,
			}),
		])

		expect(result.map((group) => group.key)).toEqual(["g-phone", "g-services"])
		expect(result[0].categories).toEqual([
			{ categoryId: "t1", name: "Telefone", amount: 20620, count: 1 },
		])
		expect(result[1].categories).toEqual([
			{ categoryId: "t2", name: "Telefone", amount: 3162, count: 1 },
		])
	})

	it("soma lançamentos repetidos e ignora valores positivos ou zero", () => {
		const result = buildSpendingByCategoryReport([
			event({
				categoryId: "c1",
				categoryName: "Transporte",
				categoryGroupId: "g-transport",
				categoryGroupName: "Transporte",
				categoryGroupType: "LIFESTYLE",
				amount: -1800,
			}),
			event({
				categoryId: "c1",
				categoryName: "Transporte",
				categoryGroupId: "g-transport",
				categoryGroupName: "Transporte",
				categoryGroupType: "LIFESTYLE",
				amount: -2200,
			}),
			event({
				categoryId: "c1",
				categoryName: "Transporte",
				categoryGroupId: "g-transport",
				categoryGroupName: "Transporte",
				categoryGroupType: "LIFESTYLE",
				amount: 500,
			}),
			event({
				categoryId: "c9",
				categoryName: "Outro",
				categoryGroupId: "g-other",
				categoryGroupName: "Outros",
				categoryGroupType: "LIFESTYLE",
				amount: 0,
			}),
		])

		expect(result).toEqual([
			{
				key: "g-transport",
				name: "Transporte",
				type: "LIFESTYLE",
				iconKey: "transport",
				total: 4000,
				count: 2,
				categories: [
					{ categoryId: "c1", name: "Transporte", amount: 4000, count: 2 },
				],
			},
		])
	})
})
