import { describe, it, expect } from "vitest"
import { ASSISTANT_SYSTEM_PROMPT, buildSystemPrompt } from "./prompts"
import { filterPortugueseParagraphs, stripThinkingBlocks } from "./text"
import { formatDivergencesForChat } from "./tools"

describe("buildSystemPrompt", () => {
	it("injeta a data atual (Brasília) como âncora", () => {
		const prompt = buildSystemPrompt(new Date("2026-09-23T12:00:00Z"))
		expect(prompt).toMatch(/Data atual: 23\/09\/2026/)
		expect(prompt).toMatch(/Quarta-feira/)
		expect(prompt).toMatch(/ASSISTANT|planejamento financeiro|Vero/)
	})
})

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

describe("filterPortugueseParagraphs", () => {
	it("remove linha em inglês colada com \\n simples no conteúdo PT", () => {
		const glued = [
			"Let me present the facts:",
			"Saldo total atual: R$ 702,77",
			"Limite diário já estourado: -R$ 228,18",
		].join("\n")
		const filtered = filterPortugueseParagraphs(glued)
		expect(filtered).not.toMatch(/Let me present/)
		expect(filtered).toMatch(/Saldo total atual/)
		expect(filtered).toMatch(/Limite diário/)
	})

	it("remove parágrafos em inglês e mantém a resposta em português", () => {
		const mixed = [
			"Let me analyze the financial summary:",
			"",
			"Total balance: R$ 702,77 (70277 cents). This seems very low.",
			"",
			"Boa notícia! De acordo com a projeção de 30 dias, sim, você terá saldo disponível até o final do mês.",
			"",
			"| Indicador | Valor |",
			"| Saldo inicial | R$ 2.496,65 |",
		].join("\n")
		const filtered = filterPortugueseParagraphs(mixed)
		expect(filtered).not.toMatch(/Let me analyze/)
		expect(filtered).not.toMatch(/seems very low/)
		expect(filtered).toMatch(/Boa notícia/)
		expect(filtered).toMatch(/Saldo inicial/)
	})

	it("preserva blocos de código e texto sem palavras", () => {
		const withChart = [
			"Aqui está a evolução:",
			"",
			'```chart\n{"type": "bar", "data": [{"label": "May", "value": 1}]}\n```',
			"",
			"R$ 8.832,77",
		].join("\n")
		const filtered = filterPortugueseParagraphs(withChart)
		expect(filtered).toMatch(/```chart/)
		expect(filtered).toMatch(/R\$ 8\.832,77/)
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
