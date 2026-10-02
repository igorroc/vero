import type { User } from "@prisma/client"

import prisma from "@/lib/db"

import { extractBearerToken, hashMcpToken } from "./token"

/**
 * Resolve o usuário dono do Bearer token da requisição MCP. Nunca confia em
 * identificador vindo do cliente: o `userId` sai do próprio registro do token.
 * Retorna `null` para token ausente, inválido, revogado ou expirado.
 */
export async function authenticateMcpRequest(req: Request): Promise<User | null> {
	const bearer = extractBearerToken(req.headers.get("authorization"))
	if (!bearer) return null

	const record = await prisma.mcpToken.findUnique({
		where: { tokenHash: hashMcpToken(bearer) },
		include: { user: true },
	})
	if (!record || record.revokedAt) return null
	if (record.expiresAt && record.expiresAt.getTime() <= Date.now()) return null

	// Best-effort: telemetria de uso não deve bloquear nem falhar a requisição.
	prisma.mcpToken
		.update({ where: { id: record.id }, data: { lastUsedAt: new Date() } })
		.catch(() => {})

	return record.user
}
