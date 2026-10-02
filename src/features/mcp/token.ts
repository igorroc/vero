import { createHash, randomBytes } from "node:crypto"

/**
 * Helpers puros de token MCP (sem "use server", testáveis).
 *
 * O token é aleatório de alta entropia, então sha256 basta para armazenar:
 * não há senha de baixa entropia para forçar, e o custo por request precisa
 * ser mínimo.
 */
export const MCP_TOKEN_PREFIX = "vmt"

export type GeneratedMcpToken = {
	token: string
	prefix: string
	tokenHash: string
}

export function hashMcpToken(token: string): string {
	return createHash("sha256").update(token).digest("hex")
}

export function generateMcpToken(): GeneratedMcpToken {
	const secret = randomBytes(32).toString("base64url")
	const token = `${MCP_TOKEN_PREFIX}_${secret}`
	return {
		token,
		prefix: token.slice(0, 12),
		tokenHash: hashMcpToken(token),
	}
}

/** Extrai o token de um header `Authorization: Bearer <token>`. */
export function extractBearerToken(header: string | null): string | null {
	if (!header) return null
	const match = /^Bearer\s+(.+)$/i.exec(header.trim())
	return match?.[1]?.trim() || null
}
