"use server"

import prisma from "@/lib/db"
import { getUserBySession } from "@/lib/auth"
import {
	mirrorIncomingTransfers,
	reconcile,
	type AccountEvent,
	type Divergence,
	type NormalizedTx,
} from "@/lib/engines/reconciliation"

export type StatementTxInput = NormalizedTx

export type MatchedEventInfo = {
	id: string
	date: string // YYYY-MM-DD
	amountCents: number
	description: string
	status: "CONFIRMED" | "PLANNED"
}

export type GetDivergencesResult =
	| {
			success: true
			divergences: Divergence[]
			events: Record<string, MatchedEventInfo>
	  }
	| { success: false; error: string }

/**
 * Compara transações do extrato (memória, vindas do parse) com os eventos
 * CONFIRMED/PLANNED da conta no período. Nada é persistido.
 */
export async function getDivergences(input: {
	accountId: string
	transactions: StatementTxInput[]
	startDate?: string // YYYY-MM-DD
	endDate?: string // YYYY-MM-DD
}): Promise<GetDivergencesResult> {
	try {
		const user = await getUserBySession()
		if (!user) return { success: false, error: "Não autenticado" }

		const account = await prisma.account.findFirst({
			where: { id: input.accountId, userId: user.id },
			select: { id: true },
		})
		if (!account) return { success: false, error: "Conta inválida" }

		const dates = input.transactions.map((tx) => tx.date).sort()
		const fallbackStart = dates[0]
		const fallbackEnd = dates[dates.length - 1]
		const startDate = input.startDate ?? fallbackStart
		const endDate = input.endDate ?? fallbackEnd
		if (!startDate || !endDate) {
			return { success: false, error: "Extrato sem transações válidas" }
		}

		// Janela ±3 dias além do extrato para o match por tolerância
		const from = new Date(`${startDate}T00:00:00Z`)
		from.setUTCDate(from.getUTCDate() - 3)
		const to = new Date(`${endDate}T00:00:00Z`)
		to.setUTCDate(to.getUTCDate() + 3)

		const events = await prisma.event.findMany({
			where: {
				userId: user.id,
				OR: [
					{ accountId: input.accountId },
					{ destinationAccountId: input.accountId },
				],
				isRecurrenceTemplate: false,
				status: { in: ["CONFIRMED", "PLANNED"] },
				date: { gte: from, lte: to },
			},
			select: {
				id: true,
				accountId: true,
				date: true,
				amount: true,
				description: true,
				status: true,
				type: true,
			},
			orderBy: { date: "asc" },
		})

		const accountEvents: AccountEvent[] = events.map((event) => ({
			id: event.id,
			accountId: event.accountId,
			date: event.date.toISOString().split("T")[0],
			amountCents: event.amount,
			description: event.description,
			status: event.status as "CONFIRMED" | "PLANNED",
			type: event.type as AccountEvent["type"],
		}))

		// Transferências recebidas entram espelhadas (+valor) como candidatas
		const reconcilable = mirrorIncomingTransfers(
			accountEvents,
			input.accountId,
		)

		const divergences = reconcile(input.transactions, reconcilable, {
			holderNames: user.name ? [user.name] : [],
		})

		const eventMap: Record<string, MatchedEventInfo> = {}
		for (const event of reconcilable) {
			eventMap[event.id] = {
				id: event.id,
				date: event.date,
				amountCents: event.amountCents,
				description: event.description,
				status: event.status,
			}
		}

		return { success: true, divergences, events: eventMap }
	} catch (error) {
		console.error("Failed to compute divergences:", error)
		return { success: false, error: "Não foi possível comparar o extrato" }
	}
}
