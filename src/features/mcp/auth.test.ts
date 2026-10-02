import { describe, it, expect, vi, beforeEach, type Mock } from "vitest"

import { hashMcpToken } from "./token"

type McpDbMock = {
	findUnique: Mock<(args: unknown) => Promise<unknown>>
	update: Mock<(args: unknown) => { catch: () => void }>
}

function mcpDb(): McpDbMock {
	const store = globalThis as unknown as { __mcpDb?: McpDbMock }
	store.__mcpDb ??= {
		findUnique: vi.fn<(args: unknown) => Promise<unknown>>(),
		update: vi.fn<(args: unknown) => { catch: () => void }>(),
	}
	return store.__mcpDb
}

vi.mock("@/lib/db", () => ({
	default: {
		mcpToken: {
			findUnique: (args: unknown) => mcpDb().findUnique(args),
			update: (args: unknown) => mcpDb().update(args),
		},
	},
}))

import { authenticateMcpRequest } from "./auth"

const user = { id: "u1", email: "user@vero.test" }

function request(headers: Record<string, string> = {}): Request {
	return new Request("http://localhost/api/mcp", { headers })
}

beforeEach(() => {
	mcpDb().findUnique.mockReset()
	mcpDb().update.mockReset()
	mcpDb().update.mockReturnValue({ catch: () => {} })
})

describe("authenticateMcpRequest", () => {
	it("retorna null sem header Authorization", async () => {
		expect(await authenticateMcpRequest(request())).toBeNull()
		expect(mcpDb().findUnique).not.toHaveBeenCalled()
	})

	it("retorna null para token desconhecido", async () => {
		mcpDb().findUnique.mockResolvedValue(null)
		expect(
			await authenticateMcpRequest(request({ authorization: "Bearer nope" })),
		).toBeNull()
	})

	it("consulta o hash do token recebido", async () => {
		mcpDb().findUnique.mockResolvedValue(null)
		await authenticateMcpRequest(request({ authorization: "Bearer vmt_abc" }))
		expect(mcpDb().findUnique).toHaveBeenCalledWith({
			where: { tokenHash: hashMcpToken("vmt_abc") },
			include: { user: true },
		})
	})

	it("rejeita token revogado", async () => {
		mcpDb().findUnique.mockResolvedValue({
			id: "t1",
			revokedAt: new Date(),
			expiresAt: null,
			user,
		})
		expect(
			await authenticateMcpRequest(request({ authorization: "Bearer vmt_abc" })),
		).toBeNull()
	})

	it("rejeita token expirado", async () => {
		mcpDb().findUnique.mockResolvedValue({
			id: "t1",
			revokedAt: null,
			expiresAt: new Date(Date.now() - 1000),
			user,
		})
		expect(
			await authenticateMcpRequest(request({ authorization: "Bearer vmt_abc" })),
		).toBeNull()
	})

	it("retorna o usuário e registra uso para token válido", async () => {
		mcpDb().findUnique.mockResolvedValue({
			id: "t1",
			revokedAt: null,
			expiresAt: null,
			user,
		})
		expect(
			await authenticateMcpRequest(request({ authorization: "Bearer vmt_abc" })),
		).toEqual(user)
		expect(mcpDb().update).toHaveBeenCalledTimes(1)
	})
})
