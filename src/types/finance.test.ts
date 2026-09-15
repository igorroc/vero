import { describe, expect, it } from "vitest"
import { dateFromInputUTC, endOfDay } from "./finance"

describe("endOfDay", () => {
	it("includes confirmed events from any time on the reference day", () => {
		const today = new Date("2026-09-07T10:00:00.000Z")
		const eventToday = new Date("2026-09-07T20:30:00.000Z")

		expect(eventToday.getTime()).toBeLessThanOrEqual(endOfDay(today).getTime())
	})
})

describe("dateFromInputUTC", () => {
	it("preserves the selected calendar day independently of the local timezone", () => {
		const date = dateFromInputUTC("2026-09-07")

		expect(date.toISOString()).toBe("2026-09-07T00:00:00.000Z")
	})
})
