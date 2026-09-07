"use server"

import prisma from "@/lib/db"
import { getUserBySession } from "@/lib/auth"
import { dollarsToCents } from "@/types/finance"

export interface UpdateTransferInput {
	id: string
	description: string
	amount: number
	date: Date
}

export async function updateTransfer(input: UpdateTransferInput) {
	try {
		const user = await getUserBySession()
		if (!user) return { success: false, error: "Não autenticado" } as const
		const description = input.description.trim()
		if (!description)
			return { success: false, error: "A descrição é obrigatória" } as const
		const amount = dollarsToCents(Math.abs(input.amount))
		if (!Number.isFinite(amount) || amount <= 0)
			return {
				success: false,
				error: "Informe um valor maior que zero",
			} as const
		const transfer = await prisma.event.findFirst({
			where: { id: input.id, userId: user.id, type: "TRANSFER" },
			select: { id: true },
		})
		if (!transfer)
			return { success: false, error: "Transferência não encontrada" } as const
		await prisma.event.update({
			where: { id: transfer.id },
			data: { description, amount: -amount, date: input.date },
		})
		return { success: true } as const
	} catch (error) {
		console.error("Failed to update transfer:", error)
		return {
			success: false,
			error: "Não foi possível atualizar a transferência",
		} as const
	}
}
