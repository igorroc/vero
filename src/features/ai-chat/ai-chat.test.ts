import { describe, it, expect } from "vitest"
import { ASSISTANT_SYSTEM_PROMPT } from "./prompts"
import { stripThinkingBlocks } from "./text"
import { formatDivergencesForChat } from "./tools"

describe("ASSISTANT_SYSTEM_PROMPT", () => {
	it("fixa regras anti-alucinação e convenções do Vero", () => {
		expect(ASSISTANT_SYSTEM_PROMPT).toMatch(/português/i)
		expect(ASSISTANT_SYSTEM_PROMPT).toMatch(/centavos/)
		expect(ASSISTANT_SYSTEM_PROMPT).toMatch(/CONFIRMAD/)
		expect(ASSISTANT_SYSTEM_PROMPT).toMatch(/PLANNED/)
		expect(ASSISTANT_SYSTEM_PROMPT).toMatch(/nunca invente/i)
	})
})

describe("stripThinkingBlocks", () => {
	it("remove blocos think e mantém a resposta", () => {
		expect(
			stripThinkingBlocks("<think>raciocínio interno</think>Vou buscar."),
		).toBe("Vou buscar.")
		expect(stripThinkingBlocks("Resposta limpa.")).toBe("Resposta limpa.")
		expect(stripThinkingBlocks("<think>sem fim")).toBe("")
	})
})

describe("formatDivergencesForChat", () => {
	it("informa quando está tudo conciliado", () => {
		expect(formatDivergencesForChat([])).toMatch(/conciliados/i)
	})

	it("formata cada divergência com tipo, valor em R$ e dica", () => {
		const text = formatDivergencesForChat([
			{
				kind: "missing_in_vero",
				description: "Pix recebido",
				date: "2026-09-21",
				amountCents: 80000,
				hint: "Crie a receita.",
			},
			{
				kind: "transfer_candidate",
				description: "Resgate CDB",
				date: "2026-09-18",
				amountCents: 224450,
				hint: "Sugestão: transferência.",
			},
		])
		expect(text).toMatch(/Só no extrato/)
		expect(text).toMatch(/Transferência\?/)
		expect(text).toMatch(/R\$\s?800,00/)
		expect(text).toMatch(/2\.244,50/)
	})
})
