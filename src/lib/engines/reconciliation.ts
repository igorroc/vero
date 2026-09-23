/**
 * Motor de conciliação extrato x lançamentos.
 *
 * Puro e determinístico: sem acesso a banco, sem IA, sem datas "hoje".
 * Valores em centavos (int). Datas como `YYYY-MM-DD`.
 */

export type NormalizedTx = {
	date: string // YYYY-MM-DD
	amountCents: number // int, + entrada / - saída
	description: string // texto original sanitizado (trim)
	fitId: string | null // FITID do OFX quando houver
	source?: string // ex. "bradesco-csv" | "inter-csv" | "inter-ofx"
}

export type ReconcilableEvent = {
	id: string
	date: string // YYYY-MM-DD
	amountCents: number // int, mesma convenção de sinal
	description: string
	status: "CONFIRMED" | "PLANNED"
	type: "INCOME" | "EXPENSE" | "INVESTMENT" | "TRANSFER"
}

export type DivergenceKind =
	| "matched"
	| "missing_in_vero"
	| "missing_in_statement"
	| "value_mismatch"
	| "transfer_candidate"

export type TransferDirection =
	| "to_investment" // saída da conta comum -> investimento (ex. Aplicação CDB)
	| "from_investment" // entrada vinda de investimento (ex. Resgate CDB)
	| "between_accounts" // transferência entre contas próprias (ex. Pix para si)

export type Divergence = {
	kind: DivergenceKind
	statementTx: NormalizedTx | null
	eventId: string | null
	/** Ação sugerida na interface. */
	suggestedAction: "none" | "create_event" | "confirm_event" | "create_transfer"
	transferDirection: TransferDirection | null
	/** Texto determinístico em PT-BR (sem IA). */
	hint: string
}

export type ReconcileOptions = {
	/** Nomes do titular para detectar auto-transferência (ex. ["Fulano de Tal"]). */
	holderNames?: string[]
	/** Tolerância de data em dias (padrão 3). */
	dateToleranceDays?: number
}

const INVESTMENT_KEYWORDS = [
	"aplicacao",
	"resgate",
	"cdb",
	"cdi",
	"tesouro",
	"fundo",
	"aporte",
	"cdb credito",
]

/** Minúsculas, sem acento, sem pontuação, espaços simples. */
export function normalizeDescription(value: string): string {
	return value
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[^a-z0-9\s]/g, " ")
		.replace(/\s+/g, " ")
		.trim()
}

function tokens(value: string): string[] {
	return normalizeDescription(value)
		.split(" ")
		.filter((token) => token.length >= 2)
}

/** Similaridade Jaccard entre 0 e 1 sobre tokens. */
export function descriptionSimilarity(a: string, b: string): number {
	const setA = new Set(tokens(a))
	const setB = new Set(tokens(b))
	if (setA.size === 0 || setB.size === 0) return 0
	let intersection = 0
	for (const token of setA) {
		if (setB.has(token)) intersection += 1
	}
	return intersection / (setA.size + setB.size - intersection)
}

function daysBetween(a: string, b: string): number {
	const ms = Date.parse(`${a}T00:00:00Z`) - Date.parse(`${b}T00:00:00Z`)
	return Math.abs(Math.round(ms / 86_400_000))
}

function isInvestmentKeyword(description: string): boolean {
	const normalized = normalizeDescription(description)
	return INVESTMENT_KEYWORDS.some((keyword) => normalized.includes(keyword))
}

function isSelfCounterparty(
	description: string,
	holderNames: string[],
): boolean {
	const normalized = normalizeDescription(description)
	return holderNames.some((name) => {
		const normalizedHolder = normalizeDescription(name)
		return normalizedHolder.length >= 4 && normalized.includes(normalizedHolder)
	})
}

export function classifyTransferDirection(
	tx: NormalizedTx,
	holderNames: string[] = [],
): TransferDirection | null {
	if (isInvestmentKeyword(tx.description)) {
		return tx.amountCents < 0 ? "to_investment" : "from_investment"
	}
	if (
		holderNames.length > 0 &&
		isSelfCounterparty(tx.description, holderNames)
	) {
		return "between_accounts"
	}
	return null
}

function statementKey(tx: NormalizedTx): string {
	return [
		tx.date,
		tx.amountCents,
		normalizeDescription(tx.description),
		tx.fitId ?? "",
	].join("|")
}

export function reconcile(
	statement: NormalizedTx[],
	events: ReconcilableEvent[],
	options: ReconcileOptions = {},
): Divergence[] {
	const tolerance = options.dateToleranceDays ?? 3
	const holderNames = options.holderNames ?? []
	const divergences: Divergence[] = []
	const matchedEventIds = new Set<string>()

	// Deduplicação do extrato (Bradesco tem 2 seções que podem se sobrepor;
	// re-upload usa FITID). Zeros já devem ter sido descartados no parse.
	const seen = new Set<string>()
	const uniqueStatement = statement.filter((tx) => {
		if (tx.amountCents === 0) return false
		const key = statementKey(tx)
		if (seen.has(key)) return false
		seen.add(key)
		return true
	})

	for (const tx of uniqueStatement) {
		const amountMatches = events.filter(
			(event) =>
				!matchedEventIds.has(event.id) &&
				event.amountCents === tx.amountCents &&
				daysBetween(event.date, tx.date) <= tolerance,
		)

		if (amountMatches.length > 0) {
			amountMatches.sort((a, b) => {
				const simDiff =
					descriptionSimilarity(b.description, tx.description) -
					descriptionSimilarity(a.description, tx.description)
				if (simDiff !== 0) return simDiff
				return daysBetween(a.date, tx.date) - daysBetween(b.date, tx.date)
			})
			const best = amountMatches[0]
			matchedEventIds.add(best.id)
			const isPlanned = best.status === "PLANNED"
			divergences.push({
				kind: "matched",
				statementTx: tx,
				eventId: best.id,
				suggestedAction: isPlanned ? "confirm_event" : "none",
				transferDirection: null,
				hint: isPlanned
					? `Bate com o lançamento planejado "${best.description}". Confirme para refletir no saldo.`
					: `Conciliado com "${best.description}".`,
			})
			continue
		}

		// Sem match de valor: procura mesma época + descrição parecida.
		const similar = events
			.filter(
				(event) =>
					!matchedEventIds.has(event.id) &&
					daysBetween(event.date, tx.date) <= tolerance &&
					descriptionSimilarity(event.description, tx.description) >= 0.5,
			)
			.sort(
				(a, b) =>
					descriptionSimilarity(b.description, tx.description) -
					descriptionSimilarity(a.description, tx.description),
			)[0]

		if (similar) {
			matchedEventIds.add(similar.id)
			divergences.push({
				kind: "value_mismatch",
				statementTx: tx,
				eventId: similar.id,
				suggestedAction: "none",
				transferDirection: null,
				hint: `Valor difere do lançamento "${similar.description}". Verifique e ajuste manualmente.`,
			})
			continue
		}

		const direction = classifyTransferDirection(tx, holderNames)
		if (direction) {
			divergences.push({
				kind: "transfer_candidate",
				statementTx: tx,
				eventId: null,
				suggestedAction: "create_transfer",
				transferDirection: direction,
				hint:
					direction === "to_investment"
						? "Parece aplicação em investimento. Sugestão: transferência da conta atual para a conta de investimento."
						: direction === "from_investment"
							? "Parece resgate de investimento. Sugestão: transferência da conta de investimento para a conta atual."
							: "Parece transferência entre suas contas. Escolha a conta de destino para registrar.",
			})
			continue
		}

		divergences.push({
			kind: "missing_in_vero",
			statementTx: tx,
			eventId: null,
			suggestedAction: "create_event",
			transferDirection: null,
			hint:
				tx.amountCents > 0
					? "Entrada no extrato sem lançamento correspondente. Crie a receita."
					: "Saída no extrato sem lançamento correspondente. Crie a despesa.",
		})
	}

	for (const event of events) {
		if (event.status !== "CONFIRMED") continue
		if (event.type === "TRANSFER") continue
		if (matchedEventIds.has(event.id)) continue
		divergences.push({
			kind: "missing_in_statement",
			statementTx: null,
			eventId: event.id,
			suggestedAction: "none",
			transferDirection: null,
			hint: `Lançamento confirmado "${event.description}" não aparece no extrato. Verifique se foi em outra conta ou período.`,
		})
	}

	return divergences
}
