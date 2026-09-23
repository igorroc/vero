import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { createOpenAI } from "@ai-sdk/openai"
import { createOpenAICompatible } from "@ai-sdk/openai-compatible"
import type { LanguageModel } from "ai"

import { env } from "@/lib/env"

/**
 * Provedor de IA trocável via variáveis de ambiente (Vercel AI SDK).
 * Trocar de modelo/provedor = mudar env, sem reescrever código.
 *
 * Fonte única de configuração: `@/lib/env`. Os `overrides` existem apenas
 * para testes unitários (injeção sem tocar em `process.env`).
 */
export class AiNotConfiguredError extends Error {
	constructor(provider: string) {
		super(
			`Recurso de IA indisponível: configure a chave do provedor (${provider}). CSV e OFX continuam funcionando.`,
		)
		this.name = "AiNotConfiguredError"
	}
}

export type AiProvider = "openai" | "google" | "openrouter"

export type AiConfig = {
	provider: AiProvider
	model?: string
	openaiKey?: string
	googleKey?: string
	openrouterKey?: string
}

export function getAiProvider(config: Partial<AiConfig> = {}): AiProvider {
	return config.provider ?? env.AI_PROVIDER
}

/** Modelo configurado (ou o padrão de cada provedor). */
export function getStatementModelId(config: Partial<AiConfig> = {}): string {
	const custom = config.model ?? env.AI_MODEL
	if (custom?.trim()) return custom.trim()
	const provider = getAiProvider(config)
	if (provider === "google") return "gemini-2.5-flash-lite"
	if (provider === "openrouter") {
		// Router gratuito: escolhe sozinho um modelo free com os recursos
		// exigidos (PDF, JSON estruturado, tools). 50 req/dia sem cartão.
		return "openrouter/free"
	}
	return "gpt-4o-mini"
}

/** Instancia o modelo de extração. Lança AiNotConfiguredError sem chave. */
export function getStatementModel(
	config: Partial<AiConfig> = {},
): LanguageModel {
	const provider = getAiProvider(config)
	const modelId = getStatementModelId({ ...config, provider })
	if (provider === "google") {
		const apiKey = config.googleKey ?? env.GOOGLE_GENERATIVE_AI_API_KEY
		if (!apiKey?.trim()) {
			throw new AiNotConfiguredError("GOOGLE_GENERATIVE_AI_API_KEY")
		}
		return createGoogleGenerativeAI({ apiKey: apiKey.trim() })(modelId)
	}
	if (provider === "openrouter") {
		const apiKey = config.openrouterKey ?? env.OPENROUTER_API_KEY
		if (!apiKey?.trim()) {
			throw new AiNotConfiguredError("OPENROUTER_API_KEY")
		}
		return createOpenAICompatible({
			baseURL: "https://openrouter.ai/api/v1",
			apiKey: apiKey.trim(),
			name: "openrouter",
		})(modelId)
	}
	const apiKey = config.openaiKey ?? env.OPENAI_API_KEY
	if (!apiKey?.trim()) throw new AiNotConfiguredError("OPENAI_API_KEY")
	return createOpenAI({ apiKey: apiKey.trim() })(modelId)
}
