import { describe, expect, it } from "vitest"

import { mapPolarSubscriptionStatus } from "./polar-subscriptions"

describe("mapPolarSubscriptionStatus", () => {
	it("keeps access while cancellation is scheduled for the period end", () => {
		expect(mapPolarSubscriptionStatus("active", true)).toBe("CANCELING")
		expect(mapPolarSubscriptionStatus("active", false)).toBe("ACTIVE")
	})

	it("preserves recoverable payment failures and revokes expired subscriptions", () => {
		expect(mapPolarSubscriptionStatus("past_due", false)).toBe("PAST_DUE")
		expect(mapPolarSubscriptionStatus("unpaid", false)).toBe("CANCELED")
		expect(mapPolarSubscriptionStatus("canceled", false)).toBe("CANCELED")
	})

	it("does not grant access for unknown provider states", () => {
		expect(mapPolarSubscriptionStatus("pending", false)).toBe("UNPAID")
	})
})
