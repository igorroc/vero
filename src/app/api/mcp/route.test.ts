import { describe, it, expect, vi, beforeEach, type Mock } from "vitest"

import { getRequestUser } from "@/lib/request-context"

type RouteMocks = {
	fakeHandler: Mock<(req: Request) => Promise<Response>>
	authenticateMcpRequest: Mock<(req: Request) => Promise<unknown>>
}

function routeMocks(): RouteMocks {
	const store = globalThis as unknown as { __mcpRouteMocks?: RouteMocks }
	store.__mcpRouteMocks ??= {
		fakeHandler: vi.fn<(req: Request) => Promise<Response>>(),
		authenticateMcpRequest: vi.fn<(req: Request) => Promise<unknown>>(),
	}
	return store.__mcpRouteMocks
}

vi.mock("mcp-handler", () => ({
	createMcpHandler: () => (req: Request) => routeMocks().fakeHandler(req),
}))
vi.mock("@/features/mcp/auth", () => ({
	authenticateMcpRequest: (req: Request) =>
		routeMocks().authenticateMcpRequest(req),
}))
vi.mock("@/features/ai-chat/mcp-tools", () => ({ registerMcpTools: () => {} }))

function request(): Request {
	return new Request("http://localhost/api/mcp", { method: "POST" })
}

beforeEach(() => {
	routeMocks().authenticateMcpRequest.mockReset()
	routeMocks().fakeHandler.mockReset()
	routeMocks().fakeHandler.mockImplementation(
		async () => new Response(getRequestUser()?.id ?? "sem-usuario"),
	)
})

describe("POST /api/mcp", () => {
	it("retorna 401 sem token válido", async () => {
		routeMocks().authenticateMcpRequest.mockResolvedValue(null)
		const { POST } = await import("./route")
		const res = await POST(request())
		expect(res.status).toBe(401)
		expect(routeMocks().fakeHandler).not.toHaveBeenCalled()
	})

	it("injeta o usuário no contexto e delega para o handler", async () => {
		routeMocks().authenticateMcpRequest.mockResolvedValue({ id: "u1" })
		const { POST } = await import("./route")
		const res = await POST(request())
		expect(res.status).toBe(200)
		expect(await res.text()).toBe("u1")
	})
})
