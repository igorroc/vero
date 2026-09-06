"use server"

import prisma from "@/lib/db"
import { getUserBySession } from "@/lib/auth"
import type { Event } from "@prisma/client"
import { dollarsToCents } from "@/types/finance"

export interface CreateTransferInput {
	fromAccountId: string
	toAccountId: string
	description: string
	amount: number
	date: Date
}

export type CreateTransferResult =
	| { success: true; event: Event; warning?: string }
	| { success: false; error: string }

export async function createTransfer(
	input: CreateTransferInput,
): Promise<CreateTransferResult> {
	try {
		const user = await getUserBySession()
		if (!user) return { success: false, error: "Não autenticado" }
		if (input.fromAccountId === input.toAccountId) {
			return { success: false, error: "Selecione contas diferentes" }
		}
		const amount = dollarsToCents(Math.abs(input.amount))
		if (!Number.isFinite(amount) || amount <= 0) {
			return { success: false, error: "Informe um valor maior que zero" }
		}
		const description = input.description.trim()
		if (!description) return { success: false, error: "A descrição é obrigatória" }

		const accounts = await prisma.account.findMany({
			where: { userId: user.id, id: { in: [input.fromAccountId, input.toAccountId] } },
			select: {
				id: true,
				name: true,
				initialBalance: true,
				events: { where: { status: "CONFIRMED" }, select: { amount: true } },
				incomingTransfers: { where: { status: "CONFIRMED" }, select: { amount: true } },
			},
		})
		const fromAccount = accounts.find((account) => account.id === input.fromAccountId)
		const toAccount = accounts.find((account) => account.id === input.toAccountId)
		if (!fromAccount || !toAccount) return { success: false, error: "Conta inválida" }

		const sourceBalance = fromAccount.initialBalance +
			fromAccount.events.reduce((sum, event) => sum + event.amount, 0) -
			fromAccount.incomingTransfers.reduce((sum, event) => sum + event.amount, 0)
		const event = await prisma.event.create({
			data: {
				userId: user.id,
				accountId: fromAccount.id,
				destinationAccountId: toAccount.id,
				description,
				amount: -amount,
				type: "TRANSFER",
				status: "CONFIRMED",
				date: input.date,
				isRecurrenceTemplate: false,
			},
		})
		return {
			success: true,
			event,
			warning: sourceBalance < amount ? "A transferência deixou a conta de origem com saldo negativo." : undefined,
		}
	} catch (error) {
		console.error("Failed to create transfer:", error)
		return { success: false, error: "Não foi possível criar a transferência" }
	}
}
