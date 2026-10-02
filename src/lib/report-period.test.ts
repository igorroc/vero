import { describe, it, expect } from "vitest"
import { formatPeriodParam, parsePeriodParam } from "./report-period"

describe("parsePeriodParam", () => {
	it("lê um YYYY-MM válido", () => {
		expect(parsePeriodParam("2026-09")).toEqual({ year: 2026, month: 9 })
		expect(parsePeriodParam("2025-12")).toEqual({ year: 2025, month: 12 })
	})

	it("cai para o mês atual quando ausente ou inválido", () => {
		const now = new Date(2026, 8, 23)
		expect(parsePeriodParam(null, now)).toEqual({ year: 2026, month: 9 })
		expect(parsePeriodParam(undefined, now)).toEqual({ year: 2026, month: 9 })
		expect(parsePeriodParam("", now)).toEqual({ year: 2026, month: 9 })
		expect(parsePeriodParam("abc", now)).toEqual({ year: 2026, month: 9 })
		expect(parsePeriodParam("2026-13", now)).toEqual({ year: 2026, month: 9 })
		expect(parsePeriodParam("2026-00", now)).toEqual({ year: 2026, month: 9 })
		expect(parsePeriodParam("1999-05", now)).toEqual({ year: 2026, month: 9 })
	})
})

describe("formatPeriodParam", () => {
	it("formata com zero à esquerda", () => {
		expect(formatPeriodParam(2026, 9)).toBe("2026-09")
		expect(formatPeriodParam(2026, 12)).toBe("2026-12")
	})
})
