import type { McpServer, StandardSchemaWithJSON } from "@modelcontextprotocol/server"
import { z } from "zod"

import { answerAsUser } from "./answer"
import { chatToolDefinitions } from "./tools"

function toText(value: unknown): string {
	return typeof value === "string" ? value : JSON.stringify(value, null, 2)
}

/**
 * Registra no servidor MCP as tools de leitura do Vero (mesmos handles do chat
 * web) e o tool de análise `ask_vero`. Os handlers não recebem usuário: a
 * autenticação entra via `runWithUser`, respeitando o `userId` do token.
 */
export function registerMcpTools(server: McpServer): void {
	for (const definition of chatToolDefinitions) {
		server.registerTool(
			definition.name,
			{
				description: definition.description,
				inputSchema:
					definition.inputSchema as unknown as StandardSchemaWithJSON,
			},
			async (args) => {
				const result = await definition.execute(args as never)
				return { content: [{ type: "text" as const, text: toText(result) }] }
			},
		)
	}

	server.registerTool(
		"ask_vero",
		{
			description:
				"Pergunta livre ao assistente financeiro do Vero. Use para ANÁLISE em linguagem natural (ex. 'posso gastar X?', 'como está meu fim de mês?', 'onde passei do orçamento?'). Devolve a resposta pronta em português. Para dados brutos, prefira as tools específicas.",
			inputSchema: z.object({
				question: z
					.string()
					.min(1)
					.max(2000)
					.describe("Pergunta em linguagem natural sobre as finanças."),
			}),
		},
		async ({ question }) => {
			const answer = await answerAsUser(question)
			return { content: [{ type: "text", text: answer }] }
		},
	)
}
