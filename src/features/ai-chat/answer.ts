import { generateText, stepCountIs } from "ai"

import { getStatementModel } from "@/lib/ai/client"

import { detectPromptInjection, REFUSAL_INJECTION } from "./guardrails"
import { buildSystemPrompt } from "./prompts"
import { sanitizeAssistantReply } from "./text"
import { chatTools } from "./tools"

/**
 * Núcleo de resposta da IA, agnóstico de transporte. O chamador já autenticou
 * a pessoa (cookie no chat web ou `runWithUser` no MCP/webhook); as tools
 * resolvem o `userId` pelo contexto vigente. Devolve sempre texto puro.
 */
export async function answerAsUser(text: string): Promise<string> {
	const question = text.trim()
	if (!question) return ""

	if (detectPromptInjection(question).blocked) {
		return REFUSAL_INJECTION
	}

	const result = await generateText({
		model: getStatementModel(),
		system: buildSystemPrompt(),
		prompt: question,
		tools: chatTools,
		stopWhen: stepCountIs(6),
	})

	return sanitizeAssistantReply(result.text ?? "")
}
