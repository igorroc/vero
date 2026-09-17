import { describe, expect, it } from "vitest"

import { hasPlusAccess, resolveAccessPlan, type ActiveEntitlement } from "./access"

const now = new Date("2026-09-17T12:00:00.000Z")

function entitlement(overrides: Partial<ActiveEntitlement> = {}): ActiveEntitlement {
	return {
		id: "entitlement-id",
		plan: "PLUS",
		source: "INDIVIDUAL_SUBSCRIPTION",
		startsAt: new Date("2026-09-01T00:00:00.000Z"),
		endsAt: new Date("2026-10-01T00:00:00.000Z"),
		...overrides,
	}
}

describe("resolveAccessPlan", () => {
	it("grants Plus when an entitlement is active", () => {
		expect(resolveAccessPlan([entitlement()], now)).toBe("PLUS")
	})

	it("keeps Free when all benefits have expired", () => {
		const expired = entitlement({ endsAt: new Date("2026-09-17T11:59:59.000Z") })

		expect(resolveAccessPlan([expired], now)).toBe("FREE")
	})

	it("does not grant access before the benefit starts", () => {
		const future = entitlement({ startsAt: new Date("2026-09-18T00:00:00.000Z") })

		expect(hasPlusAccess([future], now)).toBe(false)
	})

	it("keeps Plus while any qualifying benefit remains active", () => {
		const expired = entitlement({ id: "expired", endsAt: new Date("2026-09-16T00:00:00.000Z") })
		const active = entitlement({ id: "active", source: "ADMINISTRATIVE_GRANT" })

		expect(resolveAccessPlan([expired, active], now)).toBe("PLUS")
	})
})
