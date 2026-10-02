import { describe, it, expect, vi, beforeEach, type Mock } from "vitest"
import type { McpServer } from "@modelcontextprotocol/server"

type McpMocks = {
	answerAsUser: Mock<(text: string) => Promise<string>>
	execute: Mock<(input: unknown) => Promise<unknown>>
}

function mcpMocks(): McpMocks {
	const store = globalThis as unknown as { __mcpToolMocks?: McpMocks }
	store.__mcpToolMocks ??= {
		answerAsUser: vi.fn<(text: string) => Promise<string>>(
			async () => "resposta da IA",
		),
		execute: vi.fn<(input: unknown) => Promise<unknown>>(
			async () => ({ total: "R$ 10,00" }),
		),
	}
	return store.__mcpToolMocks
}

vi.mock("./answer", () => ({
	answerAsUser: (text: string) => mcpMocks().answerAsUser(text),
}))

vi.mock("./tools", () => ({
	chatToolDefinitions: [
		{
			name: "get_financial_summary",
			description: "Resumo financeiro",
			inputSchema: {},
			execute: (input: unknown) => mcpMocks().execute(input),
		},
	],
}))

import { registerMcpTools } from "./mcp-tools"

type Registered = {
	name: string
	config: { description?: string; inputSchema?: unknown }
	handler: (args: unknown) => Promise<{ content: Array<{ text: string }> }>
}

function fakeServer() {
	const registered: Registered[] = []
	const server = {
		registerTool: (
			name: string,
			config: Registered["config"],
			handler: Registered["handler"],
		) => {
			registered.push({ name, config, handler })
		},
	} as unknown as McpServer
	return { server, registered }
}

beforeEach(() => {
	mcpMocks().answerAsUser.mockClear()
	mcpMocks().execute.mockClear()
})

describe("registerMcpTools", () => {
	it("registra as tools de dados e o ask_vero", () => {
		const { server, registered } = fakeServer()
		registerMcpTools(server)
		expect(registered.map((item) => item.name)).toEqual([
			"get_financial_summary",
			"ask_vero",
		])
	})

	it("serializa o resultado das tools de dados como texto", async () => {
		const { server, registered } = fakeServer()
		registerMcpTools(server)
		const dataTool = registered.find(
			(item) => item.name === "get_financial_summary",
		)!
		const result = await dataTool.handler({})
		expect(mcpMocks().execute).toHaveBeenCalledWith({})
		expect(result.content[0]?.text).toContain("R$ 10,00")
	})

	it("ask_vero delega para o núcleo de análise", async () => {
		const { server, registered } = fakeServer()
		registerMcpTools(server)
		const askTool = registered.find((item) => item.name === "ask_vero")!
		const result = await askTool.handler({ question: "posso gastar 100?" })
		expect(mcpMocks().answerAsUser).toHaveBeenCalledWith("posso gastar 100?")
		expect(result.content[0]?.text).toBe("resposta da IA")
	})
})
