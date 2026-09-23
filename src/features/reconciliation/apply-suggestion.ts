"use server"

import { centsToDollars } from "@/types/finance"
import { confirmEvent, createEvent } from "@/features/events"
import { createTransfer } from "@/features/events/create-transfer"
import type { EventType } from "@prisma/client"

export type ApplyResult =
	{ success: true; message: string } | { success: false; error: string }

/**
 * Cria o lançamento correspondente a uma linha do extrato sem par no Vero.
 * Delega ao createEvent existente (categoria obrigatória, plano, sinal).
 */
export async function createEventFromStatement(input: {
	accountId: string
	categoryId: string
	description: string
	amountCents: number
	date: string // YYYY-MM-DD
	type: EventType
}): Promise<ApplyResult> {
	if (!input.categoryId) {
		return { success: false, error: "Escolha uma categoria" }
	}
	if (!["INCOME", "EXPENSE", "INVESTMENT"].includes(input.type)) {
		return { success: false, error: "Tipo inválido" }
	}
	const result = await createEvent({
		accountId: input.accountId,
		categoryId: input.categoryId,
		description: input.description.trim() || "Lançamento do extrato",
		amount: centsToDollars(Math.abs(input.amountCents)),
		type: input.type,
		status: "CONFIRMED",
		date: new Date(`${input.date}T12:00:00Z`),
	})
	if (!result.success) return { success: false, error: result.error }
	return { success: true, message: "Lançamento criado e conciliado" }
}

/** Confirma um lançamento PLANNED que bateu com o extrato. */
export async function confirmEventFromDivergence(
	eventId: string,
): Promise<ApplyResult> {
	const result = await confirmEvent(eventId)
	if (!result.success) return { success: false, error: result.error }
	return { success: true, message: "Lançamento confirmado" }
}

/**
 * Cria a transferência sugerida (ex. Aplicação/Resgate CDB, Pix para si).
 * Delega ao createTransfer existente.
 */
export async function createTransferFromStatement(input: {
	fromAccountId: string
	toAccountId: string
	description: string
	amountCents: number
	date: string // YYYY-MM-DD
}): Promise<ApplyResult> {
	if (!input.toAccountId || input.fromAccountId === input.toAccountId) {
		return { success: false, error: "Escolha a conta de destino" }
	}
	const result = await createTransfer({
		fromAccountId: input.fromAccountId,
		toAccountId: input.toAccountId,
		description: input.description.trim() || "Transferência do extrato",
		amount: centsToDollars(Math.abs(input.amountCents)),
		date: new Date(`${input.date}T12:00:00Z`),
	})
	if (!result.success) return { success: false, error: result.error }
	return { success: true, message: "Transferência criada e conciliada" }
}
