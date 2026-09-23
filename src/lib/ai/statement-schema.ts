import { z } from "zod"

import { parseBRDateToISO } from "@/features/reconciliation/parsers/normalize"
import type { NormalizedTx } from "@/lib/engines/reconciliation"

/** Saída bruta esperada do modelo (validada de novo no servidor). */
export const statementTxSchema = z.object({
	date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "data deve ser YYYY-MM-DD"),
	amountCents: z.number().int("valor deve ser inteiro em centavos"),
	description: z.string().min(1, "descrição obrigatória"),
	confidence: z.number().min(0).max(1).default(1),
})

export const statementExtractionSchema = z.object({
	transactions: z.array(statementTxSchema).max(5000),
})

export type RawStatementTx = z.infer<typeof statementTxSchema>

/** Transação extraída via IA, com confiança para revisão manual. */
export type PdfTx = NormalizedTx & {
	confidence: number
	needsReview: boolean
}

export const LOW_CONFIDENCE_THRESHOLD = 0.7

/**
 * Validação pós-IA (determinística): data real, centavos inteiros seguros,
 * descrição não vazia. Retorna null quando a linha deve ser descartada.
 */
export function toNormalizedTx(raw: RawStatementTx): PdfTx | null {
	const date = parseBRDateToISO(raw.date)
	if (!date) return null
	if (!Number.isSafeInteger(raw.amountCents) || raw.amountCents === 0) {
		return null
	}
	const description = raw.description.trim()
	if (!description) return null
	const confidence =
		Number.isFinite(raw.confidence) &&
		raw.confidence >= 0 &&
		raw.confidence <= 1
			? raw.confidence
			: 0
	return {
		date,
		amountCents: raw.amountCents,
		description,
		fitId: null,
		source: "pdf",
		confidence,
		needsReview: confidence < LOW_CONFIDENCE_THRESHOLD,
	}
}
