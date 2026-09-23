import { describe, it, expect } from "vitest"
import {
	AiNotConfiguredError,
	getAiProvider,
	getStatementModel,
	getStatementModelId,
} from "./client"

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
