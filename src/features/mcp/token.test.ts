import { describe, it, expect } from "vitest"

import {
	extractBearerToken,
	generateMcpToken,
	hashMcpToken,
	MCP_TOKEN_PREFIX,
} from "./token"

describe("generateMcpToken", () => {
	it("gera token com prefixo, prefixo curto e hash consistente", () => {
		const { token, prefix, tokenHash } = generateMcpToken()
		expect(token.startsWith(`${MCP_TOKEN_PREFIX}_`)).toBe(true)
		expect(prefix).toBe(token.slice(0, 12))
		expect(tokenHash).toBe(hashMcpToken(token))
	})

	it("gera tokens distintos a cada chamada", () => {
		expect(generateMcpToken().token).not.toBe(generateMcpToken().token)
	})
})

describe("hashMcpToken", () => {
	it("é determinístico", () => {
		expect(hashMcpToken("vmt_abc")).toBe(hashMcpToken("vmt_abc"))
		expect(hashMcpToken("vmt_abc")).not.toBe(hashMcpToken("vmt_abd"))
	})
})

describe("extractBearerToken", () => {
	it.each([
		["Bearer vmt_abc", "vmt_abc"],
		["bearer  vmt_abc ", "vmt_abc"],
	])("extrai de %s", (header, expected) => {
		expect(extractBearerToken(header)).toBe(expected)
	})

	it.each([null, "", "Basic abc", "Bearer"])(
		"retorna null para %s",
		(header) => {
			expect(extractBearerToken(header)).toBeNull()
		},
	)
})
