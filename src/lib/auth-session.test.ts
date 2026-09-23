import { describe, it, expect } from "vitest"

import {
	REMEMBERED_SESSION_MAX_AGE_SECONDS,
	STANDARD_SESSION_MAX_AGE_SECONDS,
	parseRememberMe,
	resolveSessionDuration,
} from "./auth-session"

describe("resolveSessionDuration", () => {
	it("retorna sessão curta de 24h sem lembrar de mim", () => {
		const duration = resolveSessionDuration(false)

		expect(duration.maxAge).toBe(STANDARD_SESSION_MAX_AGE_SECONDS)
		expect(duration.maxAge).toBe(24 * 60 * 60)
		expect(duration.rememberMe).toBe(false)
	})

	it("retorna sessão persistente de 30 dias com lembrar de mim", () => {
		const duration = resolveSessionDuration(true)

		expect(duration.maxAge).toBe(REMEMBERED_SESSION_MAX_AGE_SECONDS)
		expect(duration.maxAge).toBe(30 * 24 * 60 * 60)
		expect(duration.rememberMe).toBe(true)
	})

	it("sessão lembrada dura mais que a sessão curta", () => {
		expect(REMEMBERED_SESSION_MAX_AGE_SECONDS).toBeGreaterThan(
			STANDARD_SESSION_MAX_AGE_SECONDS,
		)
	})
})

describe("parseRememberMe", () => {
	it("aceita 'true' do input controlado", () => {
		expect(parseRememberMe("true")).toBe(true)
	})

	it("aceita 'on' do checkbox nativo", () => {
		expect(parseRememberMe("on")).toBe(true)
	})

	it("rejeita 'false', nulo e ausente", () => {
		expect(parseRememberMe("false")).toBe(false)
		expect(parseRememberMe(null)).toBe(false)
		expect(parseRememberMe(undefined)).toBe(false)
		expect(parseRememberMe("")).toBe(false)
	})
})
