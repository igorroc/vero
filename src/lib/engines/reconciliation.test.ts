import { describe, it, expect } from "vitest"
import {
	reconcile,
	mirrorIncomingTransfers,
	normalizeDescription,
	descriptionSimilarity,
	classifyTransferDirection,
	type NormalizedTx,
	type ReconcilableEvent,
} from "./reconciliation"

const HOLDER = ["Joao dos Santos"]

function tx(
	overrides: Partial<NormalizedTx> & { date: string; amountCents: number },
): NormalizedTx {
	return {
		description: "Pix enviado",
		fitId: null,
		...overrides,
	}
}

function event(
	overrides: Partial<ReconcilableEvent> & {
		id: string
		date: string
		amountCents: number
	},
): ReconcilableEvent {
	return {
		description: "Pix enviado",
		status: "CONFIRMED",
		type: "EXPENSE",
		...overrides,
	}
}

describe("mirrorIncomingTransfers", () => {
	const received = {
		id: "t1",
		accountId: "origem",
		date: "2026-09-21",
		amountCents: -10000,
		description: "Resgate para mercado",
		status: "CONFIRMED" as const,
		type: "TRANSFER" as const,
	}

	it("espelha transferência recebida como valor positivo", () => {
		const mirrored = mirrorIncomingTransfers([received], "destino")
		expect(mirrored).toHaveLength(1)
		expect(mirrored[0].amountCents).toBe(10000)
	})

	it("mantém transferência enviada como negativa", () => {
		const mirrored = mirrorIncomingTransfers([received], "origem")
		expect(mirrored[0].amountCents).toBe(-10000)
	})

	it("não altera lançamentos comuns", () => {
		const expense = { ...received, type: "EXPENSE" as const, accountId: "outra" }
		expect(mirrorIncomingTransfers([expense], "destino")[0].amountCents).toBe(
			-10000,
		)
	})

	it("concilia extrato de resgate com transferência recebida", () => {
		const result = reconcile(
			[tx({ date: "2026-09-21", amountCents: 10000, description: "Resgate RDB" })],
			mirrorIncomingTransfers([received], "destino"),
		)
		expect(result).toHaveLength(1)
		expect(result[0].kind).toBe("matched")
		expect(result[0].eventId).toBe("t1")
	})
})

describe("normalizeDescription", () => {
	it("remove acentos, pontuação e caixa", () => {
		expect(normalizeDescription("Pix recebido: Mariána Silva Costà!")).toBe(
			"pix recebido mariana silva costa",
		)
	})

	it("equipara OFX sem acento ao CSV com acento", () => {
		expect(
			descriptionSimilarity("Mariana Silva Costa", "Mariána Silva Costà"),
		).toBe(1)
	})
})

describe("classifyTransferDirection", () => {
	it("aplicação CDB negativa é to_investment", () => {
		expect(
			classifyTransferDirection(
				tx({
					date: "2026-09-10",
					amountCents: -70213,
					description: "Aplicação Cdb Obj Pj Banco Inter S A",
				}),
			),
		).toBe("to_investment")
	})

	it("resgate CDB positivo é from_investment", () => {
		expect(
			classifyTransferDirection(
				tx({
					date: "2026-09-18",
					amountCents: 224450,
					description: "Resgate Cdb Obj Pj Banco Inter S A",
				}),
			),
		).toBe("from_investment")
	})

	it("pix para o próprio titular é between_accounts", () => {
		expect(
			classifyTransferDirection(
				tx({
					date: "2026-09-21",
					amountCents: -5000,
					description: "Pix enviado Cp Joao dos Santos",
				}),
				HOLDER,
			),
		).toBe("between_accounts")
	})

	it("pix para terceiro não é transferência", () => {
		expect(
			classifyTransferDirection(
				tx({
					date: "2026-09-21",
					amountCents: 80000,
					description: "Pix recebido Mariana Silva Costa",
				}),
				HOLDER,
			),
		).toBeNull()
	})
})

describe("reconcile", () => {
	it("concilia valor exato na mesma data", () => {
		const result = reconcile(
			[
				tx({
					date: "2026-09-21",
					amountCents: -61501,
					description: "Pix enviado Receita Federal",
					fitId: "202609210774",
				}),
			],
			[
				event({
					id: "e1",
					date: "2026-09-21",
					amountCents: -61501,
					description: "DARF Receita Federal",
				}),
			],
			{ holderNames: HOLDER },
		)
		expect(result).toHaveLength(1)
		expect(result[0].kind).toBe("matched")
		expect(result[0].suggestedAction).toBe("none")
	})

	it("tolera diferença de data de até 3 dias", () => {
		const result = reconcile(
			[
				tx({
					date: "2026-09-21",
					amountCents: 5000,
					description: "Pix recebido Cliente",
				}),
			],
			[
				event({
					id: "e1",
					date: "2026-09-19",
					amountCents: 5000,
					description: "Pix Cliente",
				}),
			],
		)
		expect(result[0].kind).toBe("matched")
	})

	it("não concilia além da tolerância", () => {
		const result = reconcile(
			[
				tx({
					date: "2026-09-21",
					amountCents: 5000,
					description: "Pix recebido Cliente",
				}),
			],
			[
				event({
					id: "e1",
					date: "2026-09-10",
					amountCents: 5000,
					description: "Pix Cliente",
				}),
			],
		)
		expect(result[0].kind).toBe("missing_in_vero")
	})

	it("match com PLANNED sugere confirmação", () => {
		const result = reconcile(
			[
				tx({
					date: "2026-09-01",
					amountCents: -96251,
					description: "Pagamento fatura cartao Inter",
				}),
			],
			[
				event({
					id: "e1",
					date: "2026-09-01",
					amountCents: -96251,
					description: "Fatura cartão Inter",
					status: "PLANNED",
					type: "EXPENSE",
				}),
			],
		)
		expect(result[0].kind).toBe("matched")
		expect(result[0].suggestedAction).toBe("confirm_event")
	})

	it("desempata por descrição quando há dois valores iguais", () => {
		const result = reconcile(
			[
				tx({
					date: "2026-09-21",
					amountCents: -5000,
					description: "Pix enviado Joao dos Santos",
				}),
			],
			[
				event({
					id: "e1",
					date: "2026-09-21",
					amountCents: -5000,
					description: "Pix Joao dos Santos",
				}),
				event({
					id: "e2",
					date: "2026-09-21",
					amountCents: -5000,
					description: "Lanche padaria",
				}),
			],
			{ holderNames: HOLDER },
		)
		expect(result[0].eventId).toBe("e1")
	})

	it("descreve value_mismatch quando descrição bate e valor difere", () => {
		const result = reconcile(
			[
				tx({
					date: "2026-09-21",
					amountCents: -53544,
					description: "Pagto eletron cobranca energia",
				}),
			],
			[
				event({
					id: "e1",
					date: "2026-09-21",
					amountCents: -53000,
					description: "Pagto eletron cobranca energia",
				}),
			],
		)
		expect(result[0].kind).toBe("value_mismatch")
		expect(result[0].eventId).toBe("e1")
	})

	it("resgate vira transfer_candidate", () => {
		const result = reconcile(
			[
				tx({
					date: "2026-09-18",
					amountCents: 224450,
					description: "Resgate Cdb Obj Pj Banco Inter S A",
				}),
			],
			[],
		)
		expect(result[0].kind).toBe("transfer_candidate")
		expect(result[0].suggestedAction).toBe("create_transfer")
		expect(result[0].transferDirection).toBe("from_investment")
	})

	it("pix de terceiro sem lançamento vira missing_in_vero", () => {
		const result = reconcile(
			[
				tx({
					date: "2026-09-21",
					amountCents: 80000,
					description: "Pix recebido Mariana Silva Costa",
				}),
			],
			[],
			{ holderNames: HOLDER },
		)
		expect(result[0].kind).toBe("missing_in_vero")
		expect(result[0].suggestedAction).toBe("create_event")
	})

	it("lançamento confirmado sem extrato vira missing_in_statement", () => {
		const result = reconcile(
			[],
			[
				event({
					id: "e1",
					date: "2026-09-15",
					amountCents: -12000,
					description: "Aluguel",
				}),
			],
		)
		expect(result[0].kind).toBe("missing_in_statement")
	})

	it("PLANNED sem extrato não vira divergência", () => {
		const result = reconcile(
			[],
			[
				event({
					id: "e1",
					date: "2026-09-15",
					amountCents: -12000,
					description: "Aluguel futuro",
					status: "PLANNED",
				}),
			],
		)
		expect(result).toHaveLength(0)
	})

	it("TRANSFER confirmado sem par não gera missing_in_statement", () => {
		const result = reconcile(
			[],
			[
				event({
					id: "t1",
					date: "2026-09-18",
					amountCents: -100000,
					description: "Transfer poupança",
					type: "TRANSFER",
				}),
			],
		)
		expect(result).toHaveLength(0)
	})

	it("deduplica linhas repetidas (duas seções do Bradesco / re-upload OFX)", () => {
		const same = tx({
			date: "2026-09-21",
			amountCents: 5000,
			description: "Pix recebido Cliente",
			fitId: "202609210773",
		})
		const result = reconcile([same, { ...same }], [])
		expect(result).toHaveLength(1)
	})

	it("ordem do extrato não afeta o resultado (PDF ordena diferente do CSV)", () => {
		const statement = [
			tx({
				date: "2026-09-21",
				amountCents: -5000,
				description: "Pix enviado Joao dos Santos",
			}),
			tx({
				date: "2026-09-21",
				amountCents: 80000,
				description: "Pix recebido Cliente",
			}),
		]
		const forward = reconcile(statement, [], { holderNames: HOLDER })
		const backward = reconcile([...statement].reverse(), [], {
			holderNames: HOLDER,
		})
		expect(backward.map((d) => d.kind).sort()).toEqual(
			forward.map((d) => d.kind).sort(),
		)
	})
})
