import type { NormalizedTx } from "@/lib/engines/reconciliation"
import { parseBRMoneyToCents, parseBRDateToISO } from "./normalize"

export type ParseCsvResult =
	| { success: true; transactions: NormalizedTx[]; skipped: number }
	| { success: false; error: string }

const CREDIT_HEADERS = [
	"credito",
	"crédito",
	"credit",
	"entrada",
	"entradas",
	"valor recebido",
	"receita",
]
const DEBIT_HEADERS = [
	"debito",
	"débito",
	"debit",
	"saida",
	"saída",
	"saídas",
	"valor pago",
	"pagamento",
]
const VALUE_HEADERS = [
	"valor",
	"value",
	"amount",
	"montante",
	"lancamento",
	"lançamento",
]
const DATE_HEADERS = [
	"data",
	"date",
	"dt",
	"data lancamento",
	"data lançamento",
]
const DESC_HEADERS = [
	"descricao",
	"descrição",
	"description",
	"historico",
	"histórico",
	"memo",
	"detalhe",
	"complemento",
]

function splitLine(line: string, delimiter: string): string[] {
	// CSV simples sem aspas aninhadas nos extratos analisados; suporta aspas básicas.
	const cells: string[] = []
	let current = ""
	let inQuotes = false
	for (const char of line) {
		if (char === '"') {
			inQuotes = !inQuotes
			continue
		}
		if (char === delimiter && !inQuotes) {
			cells.push(current)
			current = ""
			continue
		}
		current += char
	}
	cells.push(current)
	return cells.map((cell) => cell.trim())
}

function normalized(header: string): string {
	return header
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[^a-z0-9 /]/g, "")
		.replace(/\s+/g, " ")
		.trim()
}

function findIndex(headers: string[], candidates: string[]): number {
	return headers.findIndex((header) =>
		candidates.some(
			(candidate) => header === candidate || header.startsWith(candidate),
		),
	)
}

/**
 * Parser genérico de CSV de extrato (Bradesco, Inter e similares).
 * - Detecta delimitador `;` ou `,`.
 * - Pula metadados/rodapés; usa a primeira linha de cabeçalho reconhecida.
 * - Suporta coluna única de valor OU par crédito/débito.
 * - Linhas de valor zero são descartadas.
 */
export function parseStatementCsv(
	content: string,
	source: string,
): ParseCsvResult {
	const lines = content.split(/\r?\n/)
	if (lines.length === 0) return { success: false, error: "Arquivo vazio" }

	// Detecta delimitador pela primeira linha de cabeçalho candidata
	let delimiter = ";"
	let headerLineIndex = -1
	let headers: string[] = []
	for (let i = 0; i < lines.length; i += 1) {
		const line = lines[i].trim()
		if (!line) continue
		for (const candidate of [";", ","]) {
			const cells = splitLine(line, candidate).map(normalized)
			const hasDate = findIndex(cells, DATE_HEADERS) >= 0
			const hasValue =
				findIndex(cells, VALUE_HEADERS) >= 0 ||
				findIndex(cells, CREDIT_HEADERS) >= 0 ||
				findIndex(cells, DEBIT_HEADERS) >= 0
			if (hasDate && hasValue) {
				delimiter = candidate
				headerLineIndex = i
				headers = cells
				break
			}
		}
		if (headerLineIndex >= 0) break
	}
	if (headerLineIndex < 0) {
		return {
			success: false,
			error:
				"Cabeçalho não reconhecido. Verifique se o arquivo é um extrato em CSV.",
		}
	}

	const dateIdx = findIndex(headers, DATE_HEADERS)
	const valueIdx = findIndex(headers, VALUE_HEADERS)
	const creditIdx = findIndex(headers, CREDIT_HEADERS)
	const debitIdx = findIndex(headers, DEBIT_HEADERS)
	const descIdxs = headers
		.map((header, idx) => ({ header, idx }))
		.filter(({ header }) =>
			DESC_HEADERS.some(
				(candidate) => header === candidate || header.includes(candidate),
			),
		)
		.map(({ idx }) => idx)

	const transactions: NormalizedTx[] = []
	let skipped = 0
	const errors: string[] = []

	for (let i = headerLineIndex + 1; i < lines.length; i += 1) {
		const rawLine = lines[i]
		if (!rawLine.trim()) continue
		const cells = splitLine(rawLine, delimiter)
		// Seções/rodapés: "Últimos lançamentos" abre nova tabela; "Total" encerra;
		// demais notas (filtro, base de dados) são puladas.
		const joined = normalized(rawLine)
		if (
			/^(total|filtro de resultados|os dados acima|ultimos lancamentos)/.test(
				joined,
			)
		) {
			if (joined.startsWith("ultimos lancamentos")) {
				const rest = lines.slice(i + 1).join("\n")
				const nested = parseStatementCsv(rest, source)
				if (nested.success) {
					transactions.push(...nested.transactions)
					skipped += nested.skipped
				}
			}
			if (
				joined.startsWith("ultimos lancamentos") ||
				joined.startsWith("total")
			)
				break
			skipped += 1
			continue
		}

		const date = parseBRDateToISO(cells[dateIdx] ?? "")
		if (!date) {
			skipped += 1
			continue
		}

		let amount: number | null = null
		if (valueIdx >= 0) {
			amount = parseBRMoneyToCents(cells[valueIdx] ?? "")
		} else if (creditIdx >= 0 || debitIdx >= 0) {
			const credit = parseBRMoneyToCents(cells[creditIdx] ?? "")
			const debit = parseBRMoneyToCents(cells[debitIdx] ?? "")
			const creditValue = credit ?? 0
			const debitValue = debit ?? 0
			if (credit === null && debit === null) {
				amount = null
			} else {
				amount = creditValue - Math.abs(debitValue)
			}
		}
		if (amount === null) {
			errors.push(`linha ${i + 1}: valor inválido`)
			continue
		}
		if (amount === 0) {
			skipped += 1
			continue
		}

		const description =
			descIdxs.length > 0
				? descIdxs
						.map((idx) => (cells[idx] ?? "").trim())
						.filter(Boolean)
						.join(" — ")
				: cells
						.filter(
							(_, idx) =>
								idx !== dateIdx &&
								idx !== valueIdx &&
								idx !== creditIdx &&
								idx !== debitIdx,
						)
						.join(" ")
						.trim()
		if (!description) {
			errors.push(`linha ${i + 1}: descrição ausente`)
			continue
		}

		transactions.push({
			date,
			amountCents: amount,
			description,
			fitId: null,
			source,
		})
	}

	if (transactions.length === 0 && errors.length > 0) {
		return { success: false, error: errors.slice(0, 3).join("; ") }
	}

	return { success: true, transactions, skipped }
}
