import { describe, expect, it } from "vitest"

import { getOnboardingProgress } from "./progress"

const completeFacts = {
	hasAccount: true,
	hasIncomeCategory: true,
	hasExpenseCategory: true,
	hasConfiguredSettings: true,
	hasPlannedIncome: true,
	hasPlannedExpense: true,
}

describe("getOnboardingProgress", () => {
	it("requires every preparation step before making the preview available", () => {
		const progress = getOnboardingProgress(
			{ ...completeFacts, hasPlannedExpense: false },
			null,
		)

		expect(progress.preparationComplete).toBe(false)
		expect(progress.previewAvailable).toBe(false)
		expect(progress.steps.find((step) => step.id === "plan")?.completed).toBe(
			false,
		)
	})

	it("offers one preview and keeps it active only during its time window", () => {
		const now = new Date("2026-09-17T12:00:00.000Z")
		const active = getOnboardingProgress(
			completeFacts,
			{
				dismissedAt: null,
				completedAt: now,
				limitPreviewStartedAt: new Date("2026-09-17T11:50:00.000Z"),
			},
			now,
		)
		const expired = getOnboardingProgress(
			completeFacts,
			{
				dismissedAt: null,
				completedAt: now,
				limitPreviewStartedAt: new Date("2026-09-17T11:40:00.000Z"),
			},
			now,
		)

		expect(active.previewActive).toBe(true)
		expect(active.previewAvailable).toBe(false)
		expect(expired.previewActive).toBe(false)
		expect(expired.previewAvailable).toBe(false)
	})
})
