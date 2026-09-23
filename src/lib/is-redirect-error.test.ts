import { describe, it, expect } from "vitest"

import { isRedirectError } from "./is-redirect-error"

describe("isRedirectError", () => {
	it("detecta o digest NEXT_REDIRECT do Next.js", () => {
		const error = new Error("NEXT_REDIRECT") as Error & { digest: string }
		error.digest = "NEXT_REDIRECT;replace;/dashboard;307;"

		expect(isRedirectError(error)).toBe(true)
	})

	it("rejeita erros comuns", () => {
		expect(isRedirectError(new Error("Network error"))).toBe(false)
	})

	it("rejeita valores que não são Error", () => {
		expect(isRedirectError(null)).toBe(false)
		expect(isRedirectError(undefined)).toBe(false)
		expect(isRedirectError("NEXT_REDIRECT")).toBe(false)
		expect(isRedirectError({ digest: "NEXT_REDIRECT" })).toBe(false)
	})
})
