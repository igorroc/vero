import { describe, expect, it } from "vitest"

import { initialPlanCapabilities } from "./capabilities"

describe("initialPlanCapabilities", () => {
	it("defines a persisted configuration for every capability and plan", () => {
		expect(initialPlanCapabilities).toHaveLength(22)
		expect(
			initialPlanCapabilities.find(
				(capability) =>
					capability.plan === "FREE" &&
					capability.capability === "events.create.monthly",
			),
		).toMatchObject({ isEnabled: true, limit: 30 })
		expect(
			initialPlanCapabilities.find(
				(capability) =>
					capability.plan === "FREE" &&
					capability.capability === "categories.manage",
			),
		).toMatchObject({ isEnabled: true, limit: null })
	})
})
