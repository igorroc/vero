import { describe, expect, it } from "vitest"

import { mapStripeSubscriptionStatus } from "./stripe-subscriptions"

describe("mapStripeSubscriptionStatus", () => {
	it("does not grant access for unpaid or unfinished Stripe subscriptions", () => {
		for (const status of [
			"incomplete",
			"incomplete_expired",
			"paused",
			"unpaid",
		] as const) {
			expect(mapStripeSubscriptionStatus(status, false)).toBe("UNPAID")
		}
	})

	it("preserves active and scheduled-cancellation subscriptions", () => {
		expect(mapStripeSubscriptionStatus("active", false)).toBe("ACTIVE")
		expect(mapStripeSubscriptionStatus("active", true)).toBe("CANCELING")
	})
})
