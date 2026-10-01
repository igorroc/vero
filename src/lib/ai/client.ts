import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { createOpenAI } from "@ai-sdk/openai"
import { createOpenAICompatible } from "@ai-sdk/openai-compatible"
import type { LanguageModel } from "ai"
import type { ProviderOptions } from "@ai-sdk/provider-utils"

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

export type AiThinkingLevel = "minimal" | "low" | "medium" | "high"

export type AiConfig = {
	provider: AiProvider
	model?: string
	thinkingLevel?: AiThinkingLevel
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
	if (provider === "google") return "gemini-3.5-flash-lite"
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

/** Modelos que aceitam parâmetros de raciocínio sem devolver 400. */
function supportsReasoning(provider: AiProvider, modelId: string): boolean {
	if (provider === "google") {
		return modelId.startsWith("gemini-2.5") || modelId.startsWith("gemini-3")
	}
	if (provider === "openai") {
		return /^(gpt-5|gpt-6|o[1-4])/.test(modelId)
	}
	// OpenRouter recebe `reasoning` no corpo e roteia conforme o modelo.
	return true
}

/**
 * Opções de raciocínio por provedor para o CHAT. Habilita os summaries de
 * thinking e devolve os passos como `reasoning parts` (renderizados pelo
 * componente `Reasoning`). Não é usado na conciliação nem no título, onde a
 * latência extra do thinking não compensa. Modelos sem suporte ficam sem
 * opções para não quebrar a chamada.
 */
export function getReasoningProviderOptions(
	config: Partial<AiConfig> = {},
): ProviderOptions | undefined {
	const provider = getAiProvider(config)
	const modelId = getStatementModelId({ ...config, provider })
	if (!supportsReasoning(provider, modelId)) return undefined
	const level = config.thinkingLevel ?? env.AI_THINKING_LEVEL
	if (provider === "google") {
		return {
			google: {
				thinkingConfig: { thinkingLevel: level, includeThoughts: true },
			},
		}
	}
	if (provider === "openai") {
		return { openai: { reasoningEffort: level, reasoningSummary: "auto" } }
	}
	return { openrouter: { reasoning: { effort: level } } }
}
