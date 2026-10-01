import { describe, it, expect } from "vitest"
import {
	AiNotConfiguredError,
	getAiProvider,
	getReasoningProviderOptions,
	getStatementModel,
	getStatementModelId,
} from "./client"

type LooseOptions = Record<string, unknown>

describe("client AI (seleção centralizada via env, sem rede)", () => {
	it("usa o env central como padrão", () => {
		// Sem overrides: provedor vem de @/lib/env (default "openai")
		expect(["openai", "google", "openrouter"]).toContain(getAiProvider())
		expect(typeof getStatementModelId()).toBe("string")
	})

	it("openrouter usa o router gratuito por padrão", () => {
		expect(getAiProvider({ provider: "openrouter" })).toBe("openrouter")
		expect(getStatementModelId({ provider: "openrouter" })).toBe(
			"openrouter/free",
		)
	})

	it("AI_MODEL sobrescreve o padrão de cada provedor", () => {
		expect(
			getStatementModelId({
				provider: "openrouter",
				model: "qwen/qwen-3-vl-8b:free",
			}),
		).toBe("qwen/qwen-3-vl-8b:free")
	})

	it("instancia sem chamar rede quando há chave", () => {
		expect(() =>
			getStatementModel({
				provider: "openrouter",
				openrouterKey: "test-key",
			}),
		).not.toThrow()
	})

	it("lança AiNotConfiguredError sem chave (openrouter e openai)", () => {
		expect(() =>
			getStatementModel({ provider: "openrouter", openrouterKey: "" }),
		).toThrow(AiNotConfiguredError)
		expect(() =>
			getStatementModel({ provider: "openai", openaiKey: "" }),
		).toThrow(AiNotConfiguredError)
		expect(() =>
			getStatementModel({ provider: "google", googleKey: "" }),
		).toThrow(AiNotConfiguredError)
	})
})

describe("getReasoningProviderOptions", () => {
	it("google liga includeThoughts no nível pedido", () => {
		const options = getReasoningProviderOptions({
			provider: "google",
			thinkingLevel: "medium",
		}) as unknown as LooseOptions
		expect(options.google).toMatchObject({
			thinkingConfig: { thinkingLevel: "medium", includeThoughts: true },
		})
	})

	it("openai usa reasoningEffort + summary em modelo de reasoning", () => {
		const options = getReasoningProviderOptions({
			provider: "openai",
			model: "gpt-5.5",
			thinkingLevel: "low",
		}) as unknown as LooseOptions
		expect(options.openai).toMatchObject({
			reasoningEffort: "low",
			reasoningSummary: "auto",
		})
	})

	it("não envia opções para modelo sem suporte (evita 400)", () => {
		expect(
			getReasoningProviderOptions({ provider: "openai", model: "gpt-4o-mini" }),
		).toBeUndefined()
		expect(
			getReasoningProviderOptions({
				provider: "google",
				model: "gemini-2.0-flash",
			}),
		).toBeUndefined()
	})

	it("openrouter envia reasoning.effort", () => {
		const options = getReasoningProviderOptions({
			provider: "openrouter",
			thinkingLevel: "high",
		}) as unknown as LooseOptions
		expect(options.openrouter).toMatchObject({
			reasoning: { effort: "high" },
		})
	})

	it("sem override usa o default do env", () => {
		const options = getReasoningProviderOptions({
			provider: "google",
		}) as unknown as LooseOptions
		const google = options.google as {
			thinkingConfig?: { thinkingLevel?: string }
		}
		expect(google.thinkingConfig?.thinkingLevel).toBeDefined()
	})
})
