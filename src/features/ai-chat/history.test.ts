import { describe, it, expect } from "vitest"
import {
	DEFAULT_CONVERSATION_TITLE,
	extractLastUserText,
	sanitizeGeneratedTitle,
	truncateTitle,
} from "./history"

describe("truncateTitle", () => {
	it("devolve texto curto intacto", () => {
		expect(truncateTitle("Posso gastar hoje?")).toBe("Posso gastar hoje?")
	})

	it("corta texto longo com reticências", () => {
		const long =
			"Quero simular a compra de um notebook de três mil e quinhentos reais parcelado em dez vezes sem juros"
		const title = truncateTitle(long)
		expect(title.length).toBeLessThanOrEqual(81)
		expect(title.endsWith("…")).toBe(true)
	})

	it("usa o título provisório quando vazio", () => {
		expect(truncateTitle("   ")).toBe(DEFAULT_CONVERSATION_TITLE)
	})
})

describe("sanitizeGeneratedTitle", () => {
	it("remove aspas e ponto final", () => {
		expect(sanitizeGeneratedTitle('"Saldo do fim do mês."')).toBe(
			"Saldo do fim do mês",
		)
	})

	it("colapsa quebras de linha", () => {
		expect(sanitizeGeneratedTitle("Compra de\nnotebook")).toBe(
			"Compra de notebook",
		)
	})

	it("devolve vazio quando não há nada aproveitável", () => {
		expect(sanitizeGeneratedTitle(' "..." ')).toBe("")
	})
})

describe("extractLastUserText", () => {
	it("pega o texto da última mensagem do usuário", () => {
		const messages = [
			{ role: "user", parts: [{ type: "text", text: "Olá" }] },
			{ role: "assistant", parts: [{ type: "text", text: "Oi!" }] },
			{ role: "user", parts: [{ type: "text", text: "Posso gastar?" }] },
		]
		expect(extractLastUserText(messages)).toBe("Posso gastar?")
	})

	it("ignora partes sem texto e payload inválido", () => {
		expect(extractLastUserText([])).toBe("")
		expect(extractLastUserText(null)).toBe("")
		expect(
			extractLastUserText([{ role: "user", parts: [{ type: "tool" }] }]),
		).toBe("")
	})
})
