import { createMcpHandler } from "mcp-handler"

import { registerMcpTools } from "@/features/ai-chat/mcp-tools"
import { authenticateMcpRequest } from "@/features/mcp/auth"
import { runWithUser } from "@/lib/request-context"

export const maxDuration = 60

const handler = createMcpHandler(
	(server) => {
		registerMcpTools(server)
	},
	{ serverInfo: { name: "vero-mcp", version: "1.0.0" } },
)

function unauthorized(): Response {
	return new Response(JSON.stringify({ error: "Não autenticado" }), {
		status: 401,
		headers: {
			"content-type": "application/json",
			"www-authenticate": 'Bearer realm="vero-mcp"',
		},
	})
}

async function handle(req: Request): Promise<Response> {
	const user = await authenticateMcpRequest(req)
	if (!user) return unauthorized()
	return runWithUser(user, () => handler(req))
}

export function GET(req: Request) {
	return handle(req)
}

export function POST(req: Request) {
	return handle(req)
}
