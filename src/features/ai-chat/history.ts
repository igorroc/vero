/**
 * Constantes e helpers puros do histórico de conversas (sem "use server",
 * sem banco — testáveis com Vitest).
 */

/** Últimas N mensagens usadas como contexto ao continuar uma conversa. */
export const AI_HISTORY_LIMIT = 20

/** Tamanho máximo do título da conversa (gerado ou editado). */
export const AI_TITLE_MAX_LENGTH = 80

/** Título provisório até a primeira troca gerar o título real. */
export const DEFAULT_CONVERSATION_TITLE = "Nova conversa"

export interface PersistedChatMessage {
	role: "user" | "assistant"
	text: string
}

/**
 * Título fallback determinístico a partir da primeira pergunta
 * (usado quando a geração via IA falha ou está indisponível).
 */
export function truncateTitle(text: string): string {
	const collapsed = text.replace(/\s+/g, " ").trim()
	if (!collapsed) return DEFAULT_CONVERSATION_TITLE
	if (collapsed.length <= AI_TITLE_MAX_LENGTH) return collapsed
	const sliced = collapsed.slice(0, AI_TITLE_MAX_LENGTH)
	const lastSpace = sliced.lastIndexOf(" ")
	return (lastSpace > 20 ? sliced.slice(0, lastSpace) : sliced).trim() + "…"
}

/**
 * Limpa o título gerado pela IA: remove aspas/quebras e limita o tamanho.
 * Devolve "" quando não há nada aproveitável (chamador usa o fallback).
 */
export function sanitizeGeneratedTitle(text: string): string {
	const cleaned = text
		.replace(/\s+/g, " ")
		.trim()
		.replace(/^["'“”‘’]+|["'“”‘’]+$/g, "")
		.replace(/\.+$/, "")
		.trim()
	if (!cleaned) return ""
	if (cleaned.length <= AI_TITLE_MAX_LENGTH) return cleaned
	return truncateTitle(cleaned)
}

interface IncomingChatPart {
	text?: unknown
}

interface IncomingChatMessage {
	role?: unknown
	parts?: unknown
}

/**
 * Extrai o texto da ÚLTIMA mensagem do usuário no payload do cliente.
 * Formato tolerante: ignora partes sem texto em vez de quebrar.
 */
export function extractLastUserText(messages: unknown): string {
	if (!Array.isArray(messages)) return ""
	for (let i = messages.length - 1; i >= 0; i--) {
		const message = messages[i] as IncomingChatMessage
		if (message?.role !== "user" || !Array.isArray(message.parts)) continue
		const text = (message.parts as IncomingChatPart[])
			.map((part) => (typeof part?.text === "string" ? part.text : ""))
			.join("")
			.trim()
		if (text) return text
	}
	return ""
}
