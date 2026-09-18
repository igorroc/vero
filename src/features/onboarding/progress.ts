export type OnboardingFacts = {
	hasAccount: boolean
	hasIncomeCategory: boolean
	hasExpenseCategory: boolean
	hasConfiguredSettings: boolean
	hasPlannedIncome: boolean
	hasPlannedExpense: boolean
}

export type OnboardingRecord = {
	dismissedAt: Date | null
	limitPreviewStartedAt: Date | null
	completedAt: Date | null
}

export type OnboardingStepId = "account" | "categories" | "settings" | "plan"

export type OnboardingProgress = {
	dismissed: boolean
	completed: boolean
	preparationComplete: boolean
	previewAvailable: boolean
	previewActive: boolean
	steps: Array<{ id: OnboardingStepId; completed: boolean }>
}

const previewDurationMs = 15 * 60_000

export function isLimitPreviewActive(
	previewStartedAt: Date | null | undefined,
	now = new Date(),
): boolean {
	return Boolean(
		previewStartedAt &&
		now.getTime() - previewStartedAt.getTime() < previewDurationMs,
	)
}

export function getOnboardingProgress(
	facts: OnboardingFacts,
	record: OnboardingRecord | null,
	now = new Date(),
): OnboardingProgress {
	const steps = [
		{ id: "account" as const, completed: facts.hasAccount },
		{
			id: "categories" as const,
			completed: facts.hasIncomeCategory && facts.hasExpenseCategory,
		},
		{ id: "settings" as const, completed: facts.hasConfiguredSettings },
		{
			id: "plan" as const,
			completed: facts.hasPlannedIncome && facts.hasPlannedExpense,
		},
	]
	const preparationComplete = steps.every((step) => step.completed)
	const previewStartedAt = record?.limitPreviewStartedAt
	const previewActive = isLimitPreviewActive(previewStartedAt, now)

	return {
		dismissed: Boolean(record?.dismissedAt),
		completed: Boolean(record?.completedAt),
		preparationComplete,
		previewAvailable: preparationComplete && !previewStartedAt,
		previewActive,
		steps,
	}
}
