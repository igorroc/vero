import type { Cents } from "@/types/finance"

export interface DebtInstallmentPlan {
	number: number
	plannedAmount: Cents
	dueDate: Date
}

export function buildDebtInstallmentPlan(
	totalAmount: Cents,
	installmentCount: number,
	firstDueDate: Date,
): DebtInstallmentPlan[] {
	if (!Number.isInteger(totalAmount) || totalAmount <= 0) {
		throw new Error("O valor total deve ser maior que zero.")
	}
	if (!Number.isInteger(installmentCount) || installmentCount <= 0) {
		throw new Error("A quantidade de parcelas deve ser maior que zero.")
	}

	const baseAmount = Math.floor(totalAmount / installmentCount)
	const remainder = totalAmount % installmentCount

	return Array.from({ length: installmentCount }, (_, index) => ({
		number: index + 1,
		plannedAmount:
			baseAmount + (index === installmentCount - 1 ? remainder : 0),
		dueDate: addMonthsKeepingDay(firstDueDate, index),
	}))
}

export function distributeRemainingDebt(
	remainingAmount: Cents,
	installments: Array<{ id: string }>,
): Array<{ id: string; plannedAmount: Cents }> {
	if (installments.length === 0) return []
	const baseAmount = Math.floor(remainingAmount / installments.length)
	const remainder = remainingAmount % installments.length
	return installments.map((installment, index) => ({
		id: installment.id,
		plannedAmount:
			baseAmount + (index === installments.length - 1 ? remainder : 0),
	}))
}

function addMonthsKeepingDay(date: Date, months: number): Date {
	const result = new Date(
		Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1),
	)
	const lastDay = new Date(
		Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0),
	).getUTCDate()
	result.setUTCDate(Math.min(date.getUTCDate(), lastDay))
	return result
}
