"use server"

import { Prisma } from "@prisma/client"
import prisma from "@/lib/db"
import { getUserBySession } from "@/lib/auth"
import { dollarsToCents, startOfDay } from "@/types/finance"
import { buildDebtInstallmentPlan, distributeRemainingDebt } from "@/lib/engines/debt"

export interface CreateDebtInput {
	creditor: string
	description: string
	categoryId: string
	totalAmount: number
	installmentCount: number
	firstDueDate: Date
}

export interface RegisterDebtPaymentInput {
	installmentId: string
	accountId: string
	amount: number
	date: Date
}

const debtInclude = {
	category: { include: { categoryGroup: true } },
	installments: {
		orderBy: { number: "asc" },
		include: { payments: { include: { event: { include: { account: true } } } } },
	},
} satisfies Prisma.DebtInclude

export type DebtWithDetails = Prisma.DebtGetPayload<{ include: typeof debtInclude }>

function getOutstandingAmount(debt: DebtWithDetails) {
	return debt.totalAmount - debt.installments.flatMap((installment) => installment.payments).reduce((total, payment) => total + payment.amount, 0)
}

export async function createDebt(input: CreateDebtInput) {
	try {
		const user = await getUserBySession()
		if (!user) return { success: false, error: "Não autenticado" } as const
		const totalAmount = dollarsToCents(input.totalAmount)
		if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
			return { success: false, error: "Informe um valor total maior que zero" } as const
		}
		if (!input.creditor.trim() || !input.description.trim()) {
			return { success: false, error: "Credor e descrição são obrigatórios" } as const
		}
		if (!Number.isInteger(input.installmentCount) || input.installmentCount <= 0) {
			return { success: false, error: "Informe uma quantidade válida de parcelas" } as const
		}
		const category = await prisma.category.findFirst({
			where: {
				id: input.categoryId,
				userId: user.id,
				categoryGroupId: "debts",
			},
			select: { id: true, categoryGroup: { select: { type: true } } },
		})
		if (!category || category.categoryGroup.type !== "ESSENTIAL") {
			return { success: false, error: "Selecione uma categoria do grupo Dívidas" } as const
		}
		const installments = buildDebtInstallmentPlan(totalAmount, input.installmentCount, startOfDay(input.firstDueDate))
		const debt = await prisma.$transaction(async (tx) => {
			const createdDebt = await tx.debt.create({
				data: {
					userId: user.id,
					categoryId: category.id,
					creditor: input.creditor.trim(),
					description: input.description.trim(),
					totalAmount,
					installmentCount: input.installmentCount,
					installments: { createMany: { data: installments } },
				},
				include: debtInclude,
			})
			await Promise.all(
				installments.map((installment) =>
					tx.budget.upsert({
						where: {
							userId_year_month: {
								userId: user.id,
								year: installment.dueDate.getUTCFullYear(),
								month: installment.dueDate.getUTCMonth() + 1,
							},
						},
						create: {
							userId: user.id,
							year: installment.dueDate.getUTCFullYear(),
							month: installment.dueDate.getUTCMonth() + 1,
						},
						update: {},
					}),
				),
			)
			return createdDebt
		})
		return { success: true, debt } as const
	} catch (error) {
		console.error("Failed to create debt:", error)
		return { success: false, error: "Não foi possível criar a dívida" } as const
	}
}

export async function getDebts() {
	try {
		const user = await getUserBySession()
		if (!user) return { success: false, error: "Não autenticado" } as const
		const debts = await prisma.debt.findMany({
			where: { userId: user.id },
			include: debtInclude,
			orderBy: [{ status: "asc" }, { createdAt: "desc" }],
		})
		return { success: true, debts: debts.map((debt) => ({ ...debt, outstandingAmount: getOutstandingAmount(debt) })) } as const
	} catch (error) {
		console.error("Failed to get debts:", error)
		return { success: false, error: "Não foi possível carregar as dívidas" } as const
	}
}

export async function getDebt(debtId: string) {
	try {
		const user = await getUserBySession()
		if (!user) return { success: false, error: "Não autenticado" } as const
		const debt = await prisma.debt.findFirst({ where: { id: debtId, userId: user.id }, include: debtInclude })
		if (!debt) return { success: false, error: "Dívida não encontrada" } as const
		return { success: true, debt: { ...debt, outstandingAmount: getOutstandingAmount(debt) } } as const
	} catch (error) {
		console.error("Failed to get debt:", error)
		return { success: false, error: "Não foi possível carregar a dívida" } as const
	}
}

export async function registerDebtPayment(input: RegisterDebtPaymentInput) {
	try {
		const user = await getUserBySession()
		if (!user) return { success: false, error: "Não autenticado" } as const
		const amount = dollarsToCents(input.amount)
		if (!Number.isFinite(amount) || amount <= 0) return { success: false, error: "Informe um valor maior que zero" } as const
		const installment = await prisma.debtInstallment.findFirst({
			where: { id: input.installmentId, debt: { userId: user.id, status: "ACTIVE" } },
			include: { debt: { include: { installments: { include: { payments: true }, orderBy: { number: "asc" } } } } },
		})
		if (!installment) return { success: false, error: "Parcela não encontrada" } as const
		const account = await prisma.account.findFirst({ where: { id: input.accountId, userId: user.id }, select: { id: true } })
		if (!account) return { success: false, error: "Conta não encontrada" } as const
		const paidAmount = installment.debt.installments.flatMap((item) => item.payments).reduce((total, payment) => total + payment.amount, 0)
		const outstandingAmount = installment.debt.totalAmount - paidAmount
		if (amount > outstandingAmount) return { success: false, error: "O pagamento não pode superar o saldo da dívida" } as const

		const result = await prisma.$transaction(async (tx) => {
			const event = await tx.event.create({
				data: {
					userId: user.id,
					accountId: account.id,
					categoryId: installment.debt.categoryId,
					description: `Pagamento ${installment.number}/${installment.debt.installmentCount} - ${installment.debt.creditor}`,
					amount: -amount,
					type: "EXPENSE",
					costType: "RECURRENT",
					status: "CONFIRMED",
					priority: "REQUIRED",
					date: startOfDay(input.date),
				},
			})
			await tx.debtPayment.create({ data: { installmentId: installment.id, eventId: event.id, amount } })
			const remainingAmount = outstandingAmount - amount
			const currentPlannedAmount = Math.max(0, installment.plannedAmount - amount)
			const futureInstallments = installment.debt.installments.filter((item) => item.number > installment.number)
			const distribution = distributeRemainingDebt(remainingAmount - currentPlannedAmount, futureInstallments)
			await tx.debtInstallment.update({ where: { id: installment.id }, data: { plannedAmount: currentPlannedAmount } })
			await Promise.all(distribution.map((item) => tx.debtInstallment.update({ where: { id: item.id }, data: { plannedAmount: item.plannedAmount } })))
			if (remainingAmount === 0) await tx.debt.update({ where: { id: installment.debtId }, data: { status: "PAID" } })
			return event
		})
		return { success: true, event: result } as const
	} catch (error) {
		console.error("Failed to register debt payment:", error)
		return { success: false, error: "Não foi possível registrar o pagamento" } as const
	}
}
