import { describe, it, expect } from "vitest"
import { ASSISTANT_SYSTEM_PROMPT, buildSystemPrompt } from "./prompts"
import {
	filterPortugueseParagraphs,
	sanitizeAssistantReply,
	stripThinkingBlocks,
} from "./text"
import { formatDivergencesForChat, formatMonthEndForChat } from "./tools"

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

	it("ensina conta x investimento, fim do mês literal e posso comprar", () => {
		expect(ASSISTANT_SYSTEM_PROMPT).toMatch(/monthEndBalance/)
		expect(ASSISTANT_SYSTEM_PROMPT).toMatch(/RESGATAR|resgat/i)
		expect(ASSISTANT_SYSTEM_PROMPT).toMatch(/projection30d/)
		expect(ASSISTANT_SYSTEM_PROMPT).toMatch(/Posso comprar/i)
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

describe("sanitizeAssistantReply", () => {
	it("remove rascunho em inglês com centavos e mantém só a resposta em PT", () => {
		const leaked = [
			"Projection 30d: starting 249665 (R$ 2.496,65), ending 883277 (R$ 8.832,77), net change +633612 (R$ 6.336,12)",
			"Safety buffer: R$ 100,00",
			"Key observations:",
			"",
			"Current confirmed balance: R$ 702,77",
			"Safety buffer: R$ 100,00",
			"Saldo atual (confirmado): R$ 702,77",
			"Próximo evento: Evolução de obra Caixa, R$ 1.300,00 em 25/09 (planejado, não confirmado)",
			"Projeção 30 dias: R$ 8.832,77 (projeção incluindo planejados)",
			"Limite diário: R$ 228,18",
			"The answer: Sim, você tem saldo disponível, mas precisa monitorar a despesa planejada de R$ 1.300,00 em 25/09.",
			"",
			"Sim, você tem saldo disponível, mas com uma ressalva importante:",
			"",
			"Saldo atual (confirmado): R$ 702,77",
			"",
			"Limite diário: R$ 228,18",
		].join("\n")
		const clean = sanitizeAssistantReply(leaked)
		expect(clean).not.toMatch(/Projection 30d/)
		expect(clean).not.toMatch(/249665/)
		expect(clean).not.toMatch(/883277/)
		expect(clean).not.toMatch(/633612/)
		expect(clean).not.toMatch(/Safety buffer/)
		expect(clean).not.toMatch(/Key observations/)
		expect(clean).not.toMatch(/Current confirmed balance/)
		expect(clean).not.toMatch(/The answer:/)
		expect(clean).not.toMatch(/[A-Za-z]+\s+[a-z]+\s+[a-z]+:\s*R\$/)
		expect(clean).toMatch(/Sim, você tem saldo disponível/)
		expect(clean).toMatch(/Saldo atual \(confirmado\): R\$ 702,77/)
		expect(clean).toMatch(/Limite diário: R\$ 228,18/)
	})

	it("corta tudo antes do último marcador 'The answer:'", () => {
		const clean = sanitizeAssistantReply(
			"Some draft in english.\nThe answer: Resposta final em português.",
		)
		expect(clean).toBe("Resposta final em português.")
	})

	it("remove linha com valor bruto em centavos mesmo sem inglês", () => {
		const clean = sanitizeAssistantReply(
			"Saldo de 70277 precisa de atenção.\nSeu saldo está seguro.",
		)
		expect(clean).not.toMatch(/70277/)
		expect(clean).toMatch(/Seu saldo está seguro/)
	})

	it("preserva tabela, lista e bloco chart", () => {
		const input = [
			"Aqui está o resumo:",
			"",
			"| Indicador | Valor |",
			"| Saldo | R$ 702,77 |",
			"",
			"- item um",
			"",
			'```chart\n{"type": "bar", "data": [{"label": "May", "value": 1}]}\n```',
		].join("\n")
		const clean = sanitizeAssistantReply(input)
		expect(clean).toMatch(/\| Indicador \| Valor \|/)
		expect(clean).toMatch(/item um/)
		expect(clean).toMatch(/```chart/)
	})

	it("remove duplicatas exatas e blocos think", () => {
		const clean = sanitizeAssistantReply(
			"<think>draft</think>Resposta.\n\nResposta.",
		)
		expect(clean).toBe("Resposta.")
	})
})

describe("formatMonthEndForChat", () => {
	it("recomenda resgate quando a conta fecha negativa e há investimento", () => {
		const text = formatMonthEndForChat({
			availableCents: -59723,
			investmentsCents: 179388,
			afterRedeemingCents: 119665,
			monthEndDate: "2026-09-30",
		})
		expect(text).toMatch(/30\/09\/2026/)
		expect(text).toMatch(/resgat/i)
		expect(text).toMatch(/R\$\s?597,23/)
		expect(text).toMatch(/1\.196,65/)
	})

	it("alerta insuficiência mesmo após resgatar tudo", () => {
		const text = formatMonthEndForChat({
			availableCents: -200000,
			investmentsCents: 50000,
			afterRedeemingCents: -150000,
			monthEndDate: "2026-09-30",
		})
		expect(text).toMatch(/insuficiente/i)
		expect(text).toMatch(/1\.500,00/)
	})

	it("dispensa resgate quando a conta fecha positiva", () => {
		const text = formatMonthEndForChat({
			availableCents: 150000,
			investmentsCents: 179388,
			afterRedeemingCents: 329388,
			monthEndDate: "2026-09-30",
		})
		expect(text).toMatch(/Não é preciso resgatar/)
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
