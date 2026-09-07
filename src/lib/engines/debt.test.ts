import { describe, expect, it } from "vitest"
import { buildDebtInstallmentPlan, distributeRemainingDebt } from "./debt"

describe("debt engine", () => {
	it("divides installments in cents and adjusts the final installment", () => {
		const plan = buildDebtInstallmentPlan(
			1000,
			3,
			new Date("2026-01-31T00:00:00Z"),
		)
		expect(plan.map((installment) => installment.plannedAmount)).toEqual([
			333, 333, 334,
		])
		expect(
			plan.map((installment) => installment.dueDate.toISOString().slice(0, 10)),
		).toEqual(["2026-01-31", "2026-02-28", "2026-03-31"])
	})

	it("redistributes the outstanding amount across open installments", () => {
		expect(distributeRemainingDebt(901, [{ id: "a" }, { id: "b" }])).toEqual([
			{ id: "a", plannedAmount: 450 },
			{ id: "b", plannedAmount: 451 },
		])
	})
})
