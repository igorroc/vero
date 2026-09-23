import { describe, it, expect, vi } from "vitest"
import { NextRequest } from "next/server"

vi.mock("next/headers", () => ({
	cookies: async () => ({
		get: () => undefined,
		set: () => {},
	}),
}))

describe("POST /api/ai/chat", () => {
	it("retorna 401 sem sessão", async () => {
		const { POST } = await import("./route")
		const req = new NextRequest("http://localhost/api/ai/chat", {
			method: "POST",
			body: JSON.stringify({ messages: [] }),
		})
		const res = await POST(req)
		expect(res.status).toBe(401)
	})
})
