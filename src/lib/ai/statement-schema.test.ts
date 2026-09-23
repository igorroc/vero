import { describe, it, expect } from "vitest"
import {
	statementExtractionSchema,
	toNormalizedTx,
	LOW_CONFIDENCE_THRESHOLD,
} from "./statement-schema"

describe("statementExtractionSchema", () => {
	it("aceita extração válida", () => {
		const result = statementExtractionSchema.safeParse({
			transactions: [
				{
					date: "2026-09-21",
					amountCents: -61501,
					description: "Pix enviado Receita Federal",
					confidence: 0.95,
				},
			],
		})
		expect(result.success).toBe(true)
	})

	it("rejeita valor com centavos fracionados (float)", () => {
		const result = statementExtractionSchema.safeParse({
			transactions: [
				{
					date: "2026-09-21",
					amountCents: 10.5,
					description: "X",
					confidence: 1,
				},
			],
		})
		expect(result.success).toBe(false)
	})

	it("rejeita data fora do formato e descrição vazia", () => {
		expect(
			statementExtractionSchema.safeParse({
				transactions: [
					{
						date: "21/09/2026",
						amountCents: 1,
						description: "X",
						confidence: 1,
					},
				],
			}).success,
		).toBe(false)
		expect(
			statementExtractionSchema.safeParse({
				transactions: [
					{
						date: "2026-09-21",
						amountCents: 1,
						description: "  ",
						confidence: 1,
					},
				],
			}).success,
		).toBe(true) // schema aceita; toNormalizedTx descarta
	})

	it("rejeita confiança fora de 0-1", () => {
		const result = statementExtractionSchema.safeParse({
			transactions: [
				{ date: "2026-09-21", amountCents: 1, description: "X", confidence: 2 },
			],
		})
		expect(result.success).toBe(false)
	})
})

describe("toNormalizedTx (pós-validação determinística)", () => {
	it("marca needsReview abaixo do limiar", () => {
		const low = toNormalizedTx({
			date: "2026-09-21",
			amountCents: 5000,
			description: "Pix recebido",
			confidence: LOW_CONFIDENCE_THRESHOLD - 0.01,
		})
		expect(low?.needsReview).toBe(true)
		const high = toNormalizedTx({
			date: "2026-09-21",
			amountCents: 5000,
			description: "Pix recebido",
			confidence: LOW_CONFIDENCE_THRESHOLD,
		})
		expect(high?.needsReview).toBe(false)
	})

	it("descarta data inexistente, zero e descrição vazia", () => {
		expect(
			toNormalizedTx({
				date: "2026-02-30",
				amountCents: 1,
				description: "X",
				confidence: 1,
			}),
		).toBeNull()
		expect(
			toNormalizedTx({
				date: "2026-09-21",
				amountCents: 0,
				description: "X",
				confidence: 1,
			}),
		).toBeNull()
		expect(
			toNormalizedTx({
				date: "2026-09-21",
				amountCents: 1,
				description: "   ",
				confidence: 1,
			}),
		).toBeNull()
	})
})
