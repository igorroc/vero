import { convertToModelMessages, stepCountIs, streamText } from "ai"

import { getUserBySession } from "@/lib/auth"
import { AiNotConfiguredError, getStatementModel } from "@/lib/ai/client"
import { ASSISTANT_SYSTEM_PROMPT } from "@/features/ai-chat/prompts"
import { chatTools } from "@/features/ai-chat/tools"

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

	const { messages } = await req.json()
	const result = streamText({
		model,
		system: ASSISTANT_SYSTEM_PROMPT,
		messages: await convertToModelMessages(messages),
		tools: chatTools,
		// Default do SDK é 1 passo: a tool seria chamada e o resultado nunca
		// viraria resposta. Permite consultar e depois responder.
		stopWhen: stepCountIs(5),
	})
	return result.toUIMessageStreamResponse()
}
