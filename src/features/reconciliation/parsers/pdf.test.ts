import { describe, it, expect } from "vitest"
import { MockLanguageModelV4 } from "ai/test"
import { AiNotConfiguredError } from "@/lib/ai/client"
import { extractPdfStatement } from "./pdf"

const FAKE_PDF = new Uint8Array([0x25, 0x50, 0x44, 0x46])

function mockModel(response: unknown) {
	return new MockLanguageModelV4({
		provider: "mock",
		modelId: "mock-pdf",
		doGenerate: async () => ({
			content: [{ type: "text", text: JSON.stringify(response) }],
			finishReason: { unified: "stop", raw: "stop" },
			usage: {
				inputTokens: {
					total: 10,
					noCache: 10,
					cacheRead: undefined,
					cacheWrite: undefined,
				},
				outputTokens: { total: 10, text: 10, reasoning: undefined },
			},
			warnings: [],
		}),
	})
}

describe("extractPdfStatement (mock, sem custo)", () => {
	it("normaliza transações do modelo e marca baixa confiança", async () => {
		const model = mockModel({
			transactions: [
				{
					date: "2026-09-21",
					amountCents: -61501,
					description: "Pix enviado Receita Federal",
					confidence: 0.95,
				},
				{
					date: "2026-09-21",
					amountCents: 80000,
					description: "Pix recebido (truncado?)",
					confidence: 0.4,
				},
				{
					// Data inexistente passa no schema e cai na pós-validação
					date: "2026-02-30",
					amountCents: 1,
					description: "Saldo do dia",
					confidence: 1,
				},
			],
		})
		const result = await extractPdfStatement(FAKE_PDF, {
			model,
			modelId: "mock-pdf",
		})
		expect(result.success).toBe(true)
		if (!result.success) return
		expect(result.model).toBe("mock-pdf")
		expect(result.transactions).toHaveLength(2)
		expect(result.skipped).toBe(1)
		expect(result.transactions[0].needsReview).toBe(false)
		expect(result.transactions[1].needsReview).toBe(true)
	})

	it("erra amigável quando nada legível é extraído", async () => {
		const model = mockModel({ transactions: [] })
		const result = await extractPdfStatement(FAKE_PDF, {
			model,
			modelId: "mock-pdf",
		})
		expect(result.success).toBe(false)
	})

	it("lança AiNotConfiguredError sem chave (model real)", async () => {
		await expect(
			extractPdfStatement(FAKE_PDF, {
				aiConfig: { provider: "openai", openaiKey: "" },
			}),
		).rejects.toBeInstanceOf(AiNotConfiguredError)
	})
})
