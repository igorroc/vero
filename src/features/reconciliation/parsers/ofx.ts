import type { NormalizedTx } from "@/lib/engines/reconciliation"
import { parseBRMoneyToCents, parseBRDateToISO } from "./normalize"

export type ParseOfxResult =
	| { success: true; transactions: NormalizedTx[]; skipped: number }
	| { success: false; error: string }

/**
 * Parser OFX 1.x (SGML, tags sem fechamento) e 2.x (XML).
 * Usa o sinal de TRNAMT como autoridade de direção.
 * FITID é preservado para idempotência em tela.
 */
export function parseStatementOfx(
	content: string,
	source: string,
): ParseOfxResult {
	// Remove cabeçalho OFXHEADER (linhas antes de <OFX>)
	const start = content.search(/<OFX>/i)
	if (start < 0) return { success: false, error: "Arquivo OFX inválido" }
	const body = content.slice(start)

	// Divide em blocos STMTTRN (tag de abertura; fechamento opcional)
	const blocks = body.split(/<STMTTRN>/i).slice(1)
	if (blocks.length === 0) {
		return { success: false, error: "Nenhuma transação encontrada no OFX" }
	}

	const transactions: NormalizedTx[] = []
	let skipped = 0
	const errors: string[] = []

	blocks.forEach((block, index) => {
		const tag = (name: string): string | null => {
			const match = block.match(new RegExp(`<${name}>([^<\\r\\n]*)`, "i"))
			return match ? match[1].trim() : null
		}

		const rawAmount = tag("TRNAMT")
		const rawDate = tag("DTPOSTED")
		const memo = tag("MEMO") ?? ""
		const name = tag("NAME") ?? ""
		const fitId = tag("FITID")

		const amount = rawAmount ? parseBRMoneyToCents(rawAmount) : null
		const date = rawDate ? parseBRDateToISO(rawDate) : null
		const description = [memo, name]
			.map((part) => part.replace(/^["']|["']$/g, "").trim())
			.filter(Boolean)
			.filter((part, i, arr) => arr.indexOf(part) === i)
			.join(" — ")

		if (amount === null || date === null || !description) {
			errors.push(`transação ${index + 1}: dados inválidos`)
			return
		}
		if (amount === 0) {
			skipped += 1
			return
		}

		transactions.push({ date, amountCents: amount, description, fitId, source })
	})

	if (transactions.length === 0) {
		return {
			success: false,
			error: errors.slice(0, 3).join("; ") || "Nenhuma transação válida no OFX",
		}
	}

	return { success: true, transactions, skipped }
}
