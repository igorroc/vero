/**
 * Agrupamento da lista de conversas por data de atividade
 * (Hoje / Ontem / Esta semana / Mais antigas). Puro, testável.
 */

export type ConversationGroup = "Hoje" | "Ontem" | "Esta semana" | "Mais antigas"

export const CONVERSATION_GROUP_ORDER: ConversationGroup[] = [
	"Hoje",
	"Ontem",
	"Esta semana",
	"Mais antigas",
]

export interface GroupableConversation {
	id: string
	updatedAt: Date
}

function startOfDay(date: Date): Date {
	const copy = new Date(date)
	copy.setHours(0, 0, 0, 0)
	return copy
}

/** Dias corridos entre hoje e a data (0 = hoje, 1 = ontem). */
export function daysAgo(date: Date, now: Date = new Date()): number {
	const diff = startOfDay(now).getTime() - startOfDay(date).getTime()
	return Math.max(0, Math.round(diff / 86_400_000))
}

export function groupForDate(date: Date, now: Date = new Date()): ConversationGroup {
	const days = daysAgo(date, now)
	if (days <= 0) return "Hoje"
	if (days === 1) return "Ontem"
	if (days <= 7) return "Esta semana"
	return "Mais antigas"
}

/** Rótulo de horário à direita do item (10:24 / Ontem / 27/09). */
export function timeLabelForDate(date: Date, now: Date = new Date()): string {
	const group = groupForDate(date, now)
	if (group === "Hoje") {
		return date.toLocaleTimeString("pt-BR", {
			hour: "2-digit",
			minute: "2-digit",
		})
	}
	if (group === "Ontem") return "Ontem"
	return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
}

export function groupConversations<T extends GroupableConversation>(
	conversations: T[],
	now: Date = new Date(),
): Array<{ group: ConversationGroup; items: T[] }> {
	return CONVERSATION_GROUP_ORDER.map((group) => ({
		group,
		items: conversations.filter(
			(conversation) => groupForDate(conversation.updatedAt, now) === group,
		),
	})).filter((section) => section.items.length > 0)
}
