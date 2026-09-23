"use server"

import prisma from "@/lib/db"
import { getUserBySession } from "@/lib/auth"
import type { NormalizedTx } from "@/lib/engines/reconciliation"
import { parseStatementCsv } from "./parsers/csv"
import { parseStatementOfx } from "./parsers/ofx"
import { extractPdfTransactions } from "./extract-pdf-statement"

const MAX_FILE_BYTES = 10 * 1024 * 1024

export type ParseStatementResult =
	| {
			success: true
			transactions: NormalizedTx[]
			skipped: number
			source: string
			model?: string
	  }
	| { success: false; error: string }

/**
 * Lê o arquivo de extrato (CSV, OFX ou PDF) em memória, normaliza e descarta.
 * Nada é persistido: o retorno vive só na sessão de conciliação.
 */
export async function parseStatement(
	formData: FormData,
): Promise<ParseStatementResult> {
	try {
		const user = await getUserBySession()
		if (!user) return { success: false, error: "Não autenticado" }

		const accountId = String(formData.get("accountId") ?? "")
		const file = formData.get("file")
		if (!accountId) return { success: false, error: "Selecione uma conta" }
		if (!(file instanceof File)) {
			return { success: false, error: "Anexe um arquivo CSV, OFX ou PDF" }
		}

		const account = await prisma.account.findFirst({
			where: { id: accountId, userId: user.id },
			select: { id: true },
		})
		if (!account) return { success: false, error: "Conta inválida" }
		if (file.size > MAX_FILE_BYTES) {
			return {
				success: false,
				error: "Arquivo maior que 10MB. Fatie por período.",
			}
		}

		const fileName = file.name.toLowerCase()
		const isOfx = fileName.endsWith(".ofx")
		const isCsv = fileName.endsWith(".csv") || fileName.endsWith(".txt")
		const isPdf = fileName.endsWith(".pdf")
		if (!isOfx && !isCsv && !isPdf) {
			return {
				success: false,
				error: "Formato não suportado. Use CSV, OFX ou PDF.",
			}
		}

		// PDF textual vai para extração via IA (sem persistir nada)
		if (isPdf) {
			const extracted = await extractPdfTransactions(formData)
			if (!extracted.success) return { success: false, error: extracted.error }
			return {
				success: true,
				transactions: extracted.transactions,
				skipped: extracted.skipped,
				source: "pdf",
				model: extracted.model,
			}
		}

		const buffer = Buffer.from(await file.arrayBuffer())
		let content = buffer.toString("utf-8")
		// Fallback latin1 (extratos BR legados) quando o UTF-8 gera substitutos
		if (content.includes("�")) content = buffer.toString("latin1")

		const source = isOfx ? "ofx" : "csv"
		const parsed = isOfx
			? parseStatementOfx(content, source)
			: parseStatementCsv(content, source)
		if (!parsed.success) return { success: false, error: parsed.error }
		if (parsed.transactions.length > 5000) {
			return {
				success: false,
				error: "Extrato com mais de 5.000 linhas. Fatie por período.",
			}
		}

		return {
			success: true,
			transactions: parsed.transactions,
			skipped: parsed.skipped,
			source,
		}
	} catch (error) {
		console.error("Failed to parse statement:", error)
		return { success: false, error: "Não foi possível ler o extrato" }
	}
}
