/**
 * Guardrails do chat (camada determinística, sem IA).
 *
 * O prompt do sistema orienta o modelo a recusar temas fora do escopo, mas
 * prompt injection explícito ("ignore suas instruções", "revele seu prompt")
 * é barrado AQUI, sem chamar o modelo: resposta enlatada, sem custo e sem
 * chance de o modelo obedecer ao invasor. Puro e coberto por Vitest.
 */

import { createUIMessageStream, createUIMessageStreamResponse } from "ai"

/** Recusa padrão para tentativa de prompt injection (PT-BR). */
export const REFUSAL_INJECTION =
	"Não posso seguir essa instrução. Sou o assistente financeiro do Vero — posso ajudar com seus gastos, orçamento, lançamentos e planejamento. O que você quer saber sobre suas finanças?"

/**
 * Normaliza para casamento de padrões: minúsculas + sem acentos, para que
 * "instruções" e "instrucoes" casem igual.
 */
export function normalizeForGuardrails(text: string): string {
	return text
		.toLowerCase()
		.normalize("NFD")
		.replace(/\p{Diacritic}/gu, "")
}

interface InjectionPattern {
	pattern: RegExp
	reason: string
}

// Sinais FORTES e específicos de injeção (EN + PT). Intencionalmente estreitos:
// perguntas financeiras legítimas ("posso comprar um jogo?", "simulação de
// compra", "código de desconto?") NÃO casam com nenhum padrão (ver testes).
const INJECTION_PATTERNS: InjectionPattern[] = [
	{
		pattern:
			/\bignore\s+(all\s+|previous\s+|prior\s+|above\s+|your\s+|the\s+)*(instructions?|rules?|guidelines?|constraints?|system\s*prompt)\b/,
		reason: "ignore-instructions",
	},
	{
		pattern: /\bdisregard\s+(?:(?:all|previous|prior|your|the)\s+)*(instructions?|rules?|guidelines?)\b/,
		reason: "disregard-instructions",
	},
	{
		pattern:
			/\b(desconsidere|ignore)\s+(suas?|todas?|esta|essa|as|os)?\s*(instrucoes|instrucao|regras?|ordens?|diretrizes?)\b/,
		reason: "desconsidere-instrucoes",
	},
	{
		pattern:
			/\b(reveal|show|print|display|disclose|leak|repeat|quote|output|exibir|exiba|mostre|mostrar|revele|revelar|imprima|repita|exponha)\w*\s+(me\s+)?(your|the|this|seu|sua|este|esta|o|a|os|as)?\s*(system\s*prompt|prompt\s*(do\s*sistema|sistema)?|instructions?|instrucoes|instrucao|system\s*(message|instruction|prompt))\b/,
		reason: "reveal-prompt",
	},
	{
		pattern: /\b(esqueca|esqueça)\s+(suas?|todas?|as)?\s*(instrucoes|regras?)\b/,
		reason: "esqueca-regras",
	},
	{
		pattern: /\bforget\s+(?:(?:your|all|previous|prior|the)\s+)*(instructions?|rules?|guidelines?)\b/,
		reason: "forget-instructions",
	},
	{
		pattern: /\bjailbreak\b|do anything now|developer mode|modo\s+(de\s+)?desenvolvedor|\bsudo(\s+mode)?\b/,
		reason: "jailbreak-persona",
	},
	{
		pattern:
			/\b(what\s+is|what['’]s|whats|qual\s+e)\s+(?:(?:o|a|os|as)\s+)?(?:(?:seu|sua|your|the)\s+)?(system\s*prompt|prompt\s*(do\s*sistema|sistema)?)\b/,
		reason: "what-is-prompt",
	},
	{
		pattern:
			/\b(pretend|act)\s+(to\s+be|like|as)\b|\bfinja\s+(ser|que)\b|\bfinge\s+que\b|\baja\s+como\s+(outro|outra|um(a)?\s+novo(a)?)\b/,
		reason: "role-hijack",
	},
	{
		pattern:
			/\b(bypass|contorn|burl)\w*\s+(your|the|suas?|as|os|o)?\s*(filters?|rules?|restrictions?|guardrails?|safety|filtros?|regras?|restricoes?|travas?|bloqueios?|sistema)\b/,
		reason: "bypass",
	},
	{
		pattern: /^\s*(system|developer)\s*:/m,
		reason: "fake-role-prefix",
	},
]

export interface InjectionCheck {
	blocked: boolean
	reason?: string
}

/** Devolve `blocked: true` ao primeiro padrão de injeção encontrado. */
export function detectPromptInjection(text: string): InjectionCheck {
	if (!text || !text.trim()) return { blocked: false }
	// "DAN" (jailbreak persona) só em maiúsculas: a normalização minúscula
	// abaixo o destruiria, e "dan" minúsculo pode ser nome próprio.
	if (/\bDAN\b/.test(text)) return { blocked: true, reason: "jailbreak-persona" }
	const normalized = normalizeForGuardrails(text)
	for (const { pattern, reason } of INJECTION_PATTERNS) {
		if (pattern.test(normalized)) return { blocked: true, reason }
	}
	return { blocked: false }
}

/**
 * Resposta de recusa no MESMO formato do stream do chat (SSE de UIMessage
 * chunks: start → text-start → text-delta → text-end → finish), para o
 * cliente renderizar sem tratamento especial e sem chamar o modelo.
 */
export function refusalStreamResponse(text: string): Response {
	const stream = createUIMessageStream({
		execute: ({ writer }) => {
			writer.write({ type: "start" })
			writer.write({ type: "text-start", id: "guardrail-refusal" })
			writer.write({ type: "text-delta", id: "guardrail-refusal", delta: text })
			writer.write({ type: "text-end", id: "guardrail-refusal" })
			writer.write({ type: "finish" })
		},
	})
	return createUIMessageStreamResponse({ stream })
}
