"use server"

import type { McpToken } from "@prisma/client"

import prisma from "@/lib/db"
import { getUserBySession } from "@/lib/auth"

import { generateMcpToken } from "./token"

const MAX_ACTIVE_TOKENS = 10
const MAX_EXPIRES_IN_DAYS = 3650

export type McpTokenSummary = {
	id: string
	name: string
	prefix: string
	lastUsedAt: Date | null
	expiresAt: Date | null
	revokedAt: Date | null
	createdAt: Date
}

export type CreateMcpTokenResult =
	| { success: true; token: string; item: McpTokenSummary }
	| { success: false; error: string }

export type ListMcpTokensResult =
	| { success: true; tokens: McpTokenSummary[] }
	| { success: false; error: string }

export type RevokeMcpTokenResult =
	| { success: true }
	| { success: false; error: string }

function toSummary(token: McpToken): McpTokenSummary {
	return {
		id: token.id,
		name: token.name,
		prefix: token.prefix,
		lastUsedAt: token.lastUsedAt,
		expiresAt: token.expiresAt,
		revokedAt: token.revokedAt,
		createdAt: token.createdAt,
	}
}

/**
 * Gera um token MCP e devolve o texto em claro UMA única vez. O banco guarda
 * apenas o hash; não há como recuperá-lo depois.
 */
export async function createMcpToken(input: {
	name: string
	expiresInDays?: number
}): Promise<CreateMcpTokenResult> {
	const user = await getUserBySession()
	if (!user) return { success: false, error: "Não autenticado" }

	const name = input.name.trim()
	if (name.length < 1 || name.length > 60) {
		return { success: false, error: "Informe um nome de 1 a 60 caracteres." }
	}

	const expiresInDays = input.expiresInDays
	if (
		expiresInDays !== undefined &&
		(expiresInDays <= 0 ||
			expiresInDays > MAX_EXPIRES_IN_DAYS ||
			!Number.isInteger(expiresInDays))
	) {
		return {
			success: false,
			error: `A validade deve ser um número inteiro de 1 a ${MAX_EXPIRES_IN_DAYS} dias.`,
		}
	}

	const activeCount = await prisma.mcpToken.count({
		where: { userId: user.id, revokedAt: null },
	})
	if (activeCount >= MAX_ACTIVE_TOKENS) {
		return {
			success: false,
			error: `Você já tem ${MAX_ACTIVE_TOKENS} tokens ativos. Revogue um antes de criar outro.`,
		}
	}

	const { token, prefix, tokenHash } = generateMcpToken()
	const created = await prisma.mcpToken.create({
		data: {
			userId: user.id,
			name,
			prefix,
			tokenHash,
			expiresAt: expiresInDays
				? new Date(Date.now() + expiresInDays * 86_400_000)
				: null,
		},
	})

	return { success: true, token, item: toSummary(created) }
}

export async function listMcpTokens(): Promise<ListMcpTokensResult> {
	const user = await getUserBySession()
	if (!user) return { success: false, error: "Não autenticado" }

	const tokens = await prisma.mcpToken.findMany({
		where: { userId: user.id },
		orderBy: { createdAt: "desc" },
	})
	return { success: true, tokens: tokens.map(toSummary) }
}

export async function revokeMcpToken(id: string): Promise<RevokeMcpTokenResult> {
	const user = await getUserBySession()
	if (!user) return { success: false, error: "Não autenticado" }

	const result = await prisma.mcpToken.updateMany({
		where: { id, userId: user.id, revokedAt: null },
		data: { revokedAt: new Date() },
	})
	if (result.count === 0) {
		return { success: false, error: "Token não encontrado ou já revogado." }
	}
	return { success: true }
}
