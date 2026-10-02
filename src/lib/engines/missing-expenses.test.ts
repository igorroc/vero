import { describe, it, expect } from "vitest"
import {
	findMissingExpenses,
	type ExpenseRecord,
	type MissingExpensesInput,
} from "./missing-expenses"

function expense(
	input: Partial<ExpenseRecord> & {
		description: string
		amountCents: number
		date: string
	},
): ExpenseRecord {
	return {
		categoryId: null,
		categoryName: null,
		status: "CONFIRMED",
		costType: null,
		...input,
	}
}

function baseInput(
	overrides: Partial<MissingExpensesInput>,
): MissingExpensesInput {
	return {
		periodMonth: "2026-10",
		today: "2026-10-02",
		lookbackMonths: 3,
		minOccurrences: 2,
		history: [],
		current: [],
		budget: [],
		...overrides,
	}
}

describe("findMissingExpenses", () => {
	it("marca recorrente do histórico ausente no mês e não marca quem já apareceu", () => {
		const items = findMissingExpenses(
			baseInput({
				history: [
					expense({
						categoryId: "c-rent",
						categoryName: "Aluguel",
						description: "Aluguel",
						amountCents: 150000,
						date: "2026-07-05",
					}),
					expense({
						categoryId: "c-rent",
						categoryName: "Aluguel",
						description: "Aluguel",
						amountCents: 150000,
						date: "2026-08-05",
					}),
					expense({
						categoryId: "c-rent",
						categoryName: "Aluguel",
						description: "Aluguel",
						amountCents: 150000,
						date: "2026-09-05",
					}),
					expense({
						categoryId: "c-market",
						categoryName: "Mercado",
						description: "Mercado",
						amountCents: 40000,
						date: "2026-09-20",
					}),
				],
				current: [
					expense({
						categoryId: "c-market",
						categoryName: "Mercado",
						description: "Mercado",
						amountCents: 45000,
						date: "2026-10-01",
						status: "PLANNED",
					}),
				],
			}),
		)

		expect(items.map((item) => item.categoryName)).toEqual(["Aluguel"])
		const rent = items[0]
		expect(rent).toMatchObject({
			source: "recorrente",
			expectedAmountCents: 150000,
			expectedDay: 5,
			monthsPresent: 3,
			lastMonth: "2026-09",
			overdue: false,
		})
	})

	it("marca vencido primeiro e usa o dia esperado", () => {
		const items = findMissingExpenses(
			baseInput({
				history: [
					expense({
						categoryId: "c-net",
						categoryName: "Internet",
						description: "Internet",
						amountCents: 10000,
						date: "2026-08-01",
					}),
					expense({
						categoryId: "c-net",
						categoryName: "Internet",
						description: "Internet",
						amountCents: 10000,
						date: "2026-09-01",
					}),
				],
			}),
		)
		expect(items[0]).toMatchObject({ expectedDay: 1, overdue: true })
	})

	it("considera custo marcado como RECURRENT mesmo com um mês", () => {
		const items = findMissingExpenses(
			baseInput({
				history: [
					expense({
						categoryId: "c-gym",
						categoryName: "Academia",
						description: "Academia",
						amountCents: 9000,
						date: "2026-09-10",
						costType: "RECURRENT",
					}),
				],
			}),
		)
		expect(items.map((item) => item.categoryName)).toEqual(["Academia"])
	})

	it("inclui item do orçamento sem lançamento e ignora SKIPPED", () => {
		const items = findMissingExpenses(
			baseInput({
				budget: [{ categoryId: "c-accounting", categoryName: "Contabilidade", amountCents: 30000 }],
				current: [
					expense({
						categoryId: "c-skip",
						categoryName: "Streaming",
						description: "Streaming",
						amountCents: 3000,
						date: "2026-10-01",
						status: "SKIPPED",
					}),
				],
			}),
		)
		expect(items.map((item) => item.categoryName)).toEqual(["Contabilidade"])
		expect(items[0]).toMatchObject({ source: "orcamento", expectedDay: null })
	})

	it("não marca nada quando tudo está presente", () => {
		const items = findMissingExpenses(
			baseInput({
				history: [
					expense({
						categoryId: "c-rent",
						categoryName: "Aluguel",
						description: "Aluguel",
						amountCents: 150000,
						date: "2026-09-05",
					}),
					expense({
						categoryId: "c-rent",
						categoryName: "Aluguel",
						description: "Aluguel",
						amountCents: 150000,
						date: "2026-08-05",
					}),
				],
				current: [
					expense({
						categoryId: "c-rent",
						categoryName: "Aluguel",
						description: "Aluguel",
						amountCents: 150000,
						date: "2026-10-05",
						status: "PLANNED",
					}),
				],
			}),
		)
		expect(items).toHaveLength(0)
	})
})
