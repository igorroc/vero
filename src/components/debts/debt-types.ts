import type { DebtWithDetails } from "@/features/debts"

export type DebtView = DebtWithDetails & { outstandingAmount: number }
export type DebtInstallment = DebtView["installments"][number]

export type DebtFormState = {
	creditor: string
	description: string
	categoryId: string
	totalAmount: string
}

export type PaymentFormState = {
	accountId: string
	amount: string
	date: string
}

export type GenerationFormState = {
	installmentCount: string
	firstDueDate: string
}
