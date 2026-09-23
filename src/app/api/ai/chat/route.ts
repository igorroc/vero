import { convertToModelMessages, stepCountIs, streamText } from "ai"

import { getUserBySession } from "@/lib/auth"
import { AiNotConfiguredError, getStatementModel } from "@/lib/ai/client"
import { buildSystemPrompt } from "@/features/ai-chat/prompts"
import { chatTools } from "@/features/ai-chat/tools"
import {
	ensureConversationTitle,
	getHistoryForModel,
	saveChatMessage,
} from "@/features/ai-chat/conversations"
import { AI_HISTORY_LIMIT, extractLastUserText } from "@/features/ai-chat/history"
import { sanitizeAssistantReply } from "@/features/ai-chat/text"

export const maxDuration = 60

export async function POST(req: Request) {
	const user = await getUserBySession()
	if (!user) {
		return Response.json({ error: "Não autenticado" }, { status: 401 })
	}

	let model
	try {
		model = getStatementModel()
	} catch (error) {
		if (error instanceof AiNotConfiguredError) {
			return Response.json({ error: error.message }, { status: 503 })
		}
		throw error
	}

	const { messages, conversationId } = await req.json()
	const incoming = Array.isArray(messages) ? messages : []
	const userText = extractLastUserText(incoming)

	// Persistência é best-effort: sem conversationId (widget flutuante) ou
	// com banco ainda não migrado, o chat segue normalmente sem histórico.
	const persistId =
		typeof conversationId === "string" && conversationId.trim()
			? conversationId.trim()
			: null
	let contextMessages
	if (persistId) {
		const history = await getHistoryForModel(user.id, persistId)
		if (userText) {
			await saveChatMessage(user.id, persistId, "USER", userText)
		}
		contextMessages = [
			...history,
			...(userText ? [{ role: "user" as const, content: userText }] : []),
		]
	} else {
		const windowed = incoming.slice(-(AI_HISTORY_LIMIT * 2 + 1))
		contextMessages = await convertToModelMessages(windowed)
	}

	const result = streamText({
		model,
		system: buildSystemPrompt(),
		messages: contextMessages,
		tools: chatTools,
		// Default do SDK é 1 passo: a tool seria chamada e o resultado nunca
		// viraria resposta. Permite consultar e depois responder.
		stopWhen: stepCountIs(5),
		onFinish: async ({ text }) => {
			if (!persistId) return
			const clean = sanitizeAssistantReply(text ?? "")
			if (!clean) return
			await saveChatMessage(user.id, persistId, "ASSISTANT", clean)
			await ensureConversationTitle(user.id, persistId)
		},
	})
	return result.toUIMessageStreamResponse()
}
