import { describe, expect, it } from "vitest"
import { endOfDay } from "./finance"

describe("endOfDay", () => {
	it("includes confirmed events from any time on the reference day", () => {
		const today = new Date("2026-09-07T10:00:00.000Z")
		const eventToday = new Date("2026-09-07T20:30:00.000Z")

		expect(eventToday.getTime()).toBeLessThanOrEqual(endOfDay(today).getTime())
	})
})
