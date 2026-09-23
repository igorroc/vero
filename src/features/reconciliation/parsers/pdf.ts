import { createHash } from "node:crypto"

import { generateObject, type LanguageModel } from "ai"

import {
	getStatementModel,
	getStatementModelId,
	type AiConfig,
} from "@/lib/ai/client"
import {
	statementExtractionSchema,
	toNormalizedTx,
	type PdfTx,
} from "@/lib/ai/statement-schema"

export type { PdfTx }

const EXTRACTION_PROMPT = `Você extrai transações de um extrato bancário em PDF (texto em português).
Retorne TODAS as movimentações, uma por item, ignorando saldos, saldos do dia, totais, cabeçalhos, rodapés e mensagens do banco.

Regras:
- date: data da transação no formato YYYY-MM-DD (converta DD/MM/YYYY quando preciso).
- amountCents: valor INTEIRO em centavos, sem casas decimais. Entradas positivas, saídas negativas (ex. "-R$ 50,00" vira -5000; "R$ 10.250,00" vira 1025000). Nunca use ponto flutuante.
- description: contraparte e tipo de forma concisa (ex. "Pix enviado — Receita Federal"). Sem dados de saldo.
- confidence: 0 a 1. Use valor abaixo de 0.7 quando a linha estiver ambígua, truncada ou o valor incerto.
- Ignore linhas de valor zero e linhas de saldo/total.`

export type ExtractPdfResult =
	| { success: true; transactions: PdfTx[]; skipped: number; model: string }
	| { success: false; error: string }

function fileHash(bytes: Uint8Array): string {
	return createHash("sha256").update(bytes).digest("hex").slice(0, 12)
}

/**
 * Extrai transações de um PDF textual via IA (vision) com saída estruturada.
 * Aceita `model` injetado para testes (sem custo de API).
 */
export async function extractPdfStatement(
	bytes: Uint8Array,
	options: {
		model?: LanguageModel
		modelId?: string
		aiConfig?: Partial<AiConfig>
	} = {},
): Promise<ExtractPdfResult> {
	const model = options.model ?? getStatementModel(options.aiConfig ?? {})
	const modelId = options.modelId ?? getStatementModelId(options.aiConfig ?? {})

	const { object } = await generateObject({
		model,
		schema: statementExtractionSchema,
		messages: [
			{
				role: "user",
				content: [
					{ type: "text", text: EXTRACTION_PROMPT },
					{
						type: "file",
						data: bytes,
						mediaType: "application/pdf",
					},
				],
			},
		],
	})

	let skipped = 0
	const transactions: PdfTx[] = []
	for (const raw of object.transactions) {
		const normalized = toNormalizedTx(raw)
		if (normalized) transactions.push(normalized)
		else skipped += 1
	}

	// Log operacional mínimo: nunca conteúdo bancário
	console.info(
		`[reconciliation] pdf extraído via ${modelId}: hash=${fileHash(bytes)} linhas=${transactions.length} descartadas=${skipped}`,
	)

	if (transactions.length === 0) {
		return {
			success: false,
			error:
				"Nenhuma transação legível no PDF. Exporte o PDF textual do banco (PDFs escaneados ainda não são suportados).",
		}
	}
	return { success: true, transactions, skipped, model: modelId }
}
