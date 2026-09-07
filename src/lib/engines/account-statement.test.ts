import { describe, expect, it } from "vitest"
import { buildAccountStatement } from "./account-statement"

describe("buildAccountStatement", () => {
	it("applies incoming transfers as credits and groups entries by date", () => {
		const statement = buildAccountStatement({
			accountId: "checking",
			initialBalance: 100000,
			events: [
				{
					id: "income",
					description: "Salário",
					amount: 200000,
					type: "INCOME",
					date: new Date("2026-09-01T12:00:00Z"),
					accountId: "checking",
					destinationAccountId: null,
				},
				{
					id: "transfer",
					description: "Reserva",
					amount: -50000,
					type: "TRANSFER",
					date: new Date("2026-09-02T12:00:00Z"),
					accountId: "savings",
					destinationAccountId: "checking",
				},
				{
					id: "expense",
					description: "Aluguel",
					amount: -120000,
					type: "EXPENSE",
					date: new Date("2026-09-02T13:00:00Z"),
					accountId: "checking",
					destinationAccountId: null,
				},
			],
		})

		expect(statement).toHaveLength(2)
		expect(statement[0].endingBalance).toBe(230000)
		expect(statement[0].entries[0].amount).toBe(50000)
		expect(statement[0].entries[1].balanceAfter).toBe(230000)
	})

	it("applies credits before debits on the same day", () => {
		const statement = buildAccountStatement({
			accountId: "checking",
			initialBalance: 0,
			events: [
				{
					id: "expense",
					description: "Aluguel",
					amount: -120000,
					type: "EXPENSE",
					date: new Date("2026-09-02T08:00:00Z"),
					accountId: "checking",
					destinationAccountId: null,
				},
				{
					id: "income",
					description: "Salário",
					amount: 200000,
					type: "INCOME",
					date: new Date("2026-09-02T12:00:00Z"),
					accountId: "checking",
					destinationAccountId: null,
				},
			],
		})

		expect(statement[0].entries.map((entry) => entry.id)).toEqual([
			"income",
			"expense",
		])
		expect(statement[0].entries.map((entry) => entry.balanceAfter)).toEqual([
			200000, 80000,
		])
	})
})
