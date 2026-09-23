import { tool } from "ai"
import { z } from "zod"

import { getCategories } from "@/features/categories"
import { getDashboardData } from "@/features/dashboard"
import { getEvents } from "@/features/events"

const KIND_LABELS: Record<string, string> = {
	matched: "Conciliado",
	missing_in_vero: "Só no extrato",
	missing_in_statement: "Só no Vero",
	value_mismatch: "Valor difere",
	transfer_candidate: "Transferência?",
}

export type DivergenceSummaryInput = {
	kind: string
	description: string
	date: string
	amountCents: number
	hint: string
}

const divergenceSchema = z.object({
	kind: z.string(),
	description: z.string(),
	date: z.string(),
	amountCents: z.number().int(),
	hint: z.string(),
})

function formatBRL(cents: number): string {
	return (cents / 100).toLocaleString("pt-BR", {
		style: "currency",
		currency: "BRL",
	})
}

/**
 * Formatação determinística de divergências (pura, testável). A IA apresenta
 * esse texto; o match continua sendo do motor de conciliação.
 */
export function formatDivergencesForChat(
	divergences: DivergenceSummaryInput[],
): string {
	if (divergences.length === 0) {
		return "Nenhuma divergência: extrato e lançamentos estão conciliados."
	}
	const lines = divergences.map((divergence) => {
		const label = KIND_LABELS[divergence.kind] ?? divergence.kind
		return `- [${label}] ${divergence.description} · ${divergence.date} · ${formatBRL(divergence.amountCents)} — ${divergence.hint}`
	})
	return `Divergências encontradas (${divergences.length}):\n${lines.join("\n")}`
}

export const chatTools = {
	get_financial_summary: tool({
		description:
			"Resumo financeiro atual: saldo total e por conta, limite diário de gastos, próximos eventos (7 dias), projeção de 30 dias e alertas críticos.",
		inputSchema: z.object({}),
		execute: async () => {
			const result = await getDashboardData()
			if (!result.success) return { error: result.error }
			const { data } = result
			return {
				totalBalanceCents: data.availableBalance,
				accounts: data.accounts.map((account) => ({
					name: account.name,
					type: account.type,
					balanceCents: account.currentBalance,
				})),
				dailyLimitCents: data.spendingLimit?.breakdown.dailyLimit ?? null,
				weeklyLimitCents: data.spendingLimit?.breakdown.weeklyLimit ?? null,
				horizonDate:
					data.spendingLimit?.breakdown.horizonDate
						.toISOString()
						.split("T")[0] ?? null,
				safetyBufferCents: data.safetyBuffer,
				upcomingEvents: data.upcomingEvents.slice(0, 10).map((event) => ({
					description: event.description,
					amountCents: event.amount,
					date: new Date(event.date).toISOString().split("T")[0],
					type: event.type,
					status: event.status,
				})),
				projection30d: {
					startingBalanceCents: data.projectionSummary.startingBalance,
					endingBalanceCents: data.projectionSummary.endingBalance,
					netChangeCents: data.projectionSummary.netChange,
					daysUntilNegative: data.projectionSummary.daysUntilNegative,
				},
				criticalEventsCount: data.criticalEvents.length,
				criticalEvents: data.criticalEvents.slice(0, 5).map((event) => ({
					description: event.description,
					amountCents: event.amount,
				})),
			}
		},
	}),

	get_events: tool({
		description:
			"Lista lançamentos em um período (máximo 90 dias). Sem recorrências projetadas.",
		inputSchema: z.object({
			startDate: z.string().describe("Início YYYY-MM-DD"),
			endDate: z.string().describe("Fim YYYY-MM-DD"),
			status: z.enum(["PLANNED", "CONFIRMED", "SKIPPED"]).optional(),
		}),
		execute: async ({ startDate, endDate, status }) => {
			const start = new Date(`${startDate}T00:00:00Z`)
			const end = new Date(`${endDate}T00:00:00Z`)
			const days = Math.round((end.getTime() - start.getTime()) / 86_400_000)
			if (!Number.isFinite(days) || days < 0 || days > 90) {
				return { error: "Período inválido: use no máximo 90 dias." }
			}
			const result = await getEvents({
				startDate: start,
				endDate: end,
				...(status ? { status } : {}),
			})
			if (!result.success) return { error: result.error }
			return {
				events: result.events.slice(0, 50).map((event) => ({
					description: event.description,
					amountCents: event.amount,
					date: event.date.toISOString().split("T")[0],
					type: event.type,
					status: event.status,
				})),
			}
		},
	}),

	get_categories: tool({
		description: "Lista categorias do usuário agrupadas por tipo.",
		inputSchema: z.object({}),
		execute: async () => {
			const result = await getCategories()
			if (!result.success) return { error: result.error }
			return {
				categories: result.categories.map((category) => ({
					name: category.name,
					group: category.categoryGroup.name,
					groupType: category.categoryGroup.type,
				})),
			}
		},
	}),

	explain_divergences: tool({
		description:
			"Explica as divergências da conciliação atual. Recebe a lista que está na tela.",
		inputSchema: z.object({
			divergences: z.array(divergenceSchema).max(200),
		}),
		execute: async ({ divergences }) => ({
			explanation: formatDivergencesForChat(divergences),
		}),
	}),
}
