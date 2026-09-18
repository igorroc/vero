"use server"

import { EventStatus, EventType } from "@prisma/client"

import { getUserBySession } from "@/lib/auth"
import prisma from "@/lib/db"

import { getOnboardingProgress, type OnboardingProgress } from "./progress"

export type OnboardingResult =
	| { success: true; onboarding: OnboardingProgress }
	| { success: false; error: string }

export async function getOnboardingState(): Promise<OnboardingResult> {
	const user = await getUserBySession()
	if (!user) return { success: false, error: "Not authenticated" }

	return { success: true, onboarding: await getOnboardingStateForUser(user.id) }
}

export async function dismissOnboarding(): Promise<OnboardingResult> {
	const user = await getUserBySession()
	if (!user) return { success: false, error: "Not authenticated" }

	await prisma.userOnboarding.upsert({
		where: { userId: user.id },
		create: { userId: user.id, dismissedAt: new Date() },
		update: { dismissedAt: new Date() },
	})
	return { success: true, onboarding: await getOnboardingStateForUser(user.id) }
}

export async function startLimitPreview(): Promise<OnboardingResult> {
	const user = await getUserBySession()
	if (!user) return { success: false, error: "Not authenticated" }

	const onboarding = await getOnboardingStateForUser(user.id)
	if (!onboarding.preparationComplete) {
		return {
			success: false,
			error: "Conclua as etapas de preparação antes de ver seu limite seguro.",
		}
	}
	if (!onboarding.previewAvailable) {
		return {
			success: false,
			error: "A prévia gratuita do limite seguro já foi utilizada.",
		}
	}

	await prisma.userOnboarding.upsert({
		where: { userId: user.id },
		create: {
			userId: user.id,
			limitPreviewStartedAt: new Date(),
			completedAt: new Date(),
		},
		update: {
			limitPreviewStartedAt: new Date(),
			completedAt: new Date(),
		},
	})
	return { success: true, onboarding: await getOnboardingStateForUser(user.id) }
}

async function getOnboardingStateForUser(
	userId: string,
): Promise<OnboardingProgress> {
	const today = new Date()
	const startOfToday = new Date(
		Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
	)
	const [account, categories, events, onboarding] = await Promise.all([
		prisma.account.findFirst({
			where: { userId, isActive: true, type: { in: ["BANK", "CASH"] } },
			select: { id: true },
		}),
		prisma.category.findMany({
			where: { userId },
			select: { categoryGroup: { select: { type: true } } },
		}),
		prisma.event.findMany({
			where: {
				userId,
				isRecurrenceTemplate: false,
				status: EventStatus.PLANNED,
				date: { gte: startOfToday },
				type: { in: [EventType.INCOME, EventType.EXPENSE] },
			},
			select: { type: true },
		}),
		prisma.userOnboarding.findUnique({ where: { userId } }),
	])

	return getOnboardingProgress(
		{
			hasAccount: Boolean(account),
			hasIncomeCategory: categories.some(
				(category) => category.categoryGroup.type === "INCOME",
			),
			hasExpenseCategory: categories.some(
				(category) =>
					category.categoryGroup.type === "ESSENTIAL" ||
					category.categoryGroup.type === "LIFESTYLE",
			),
			hasConfiguredSettings: Boolean(onboarding?.settingsConfiguredAt),
			hasPlannedIncome: events.some((event) => event.type === EventType.INCOME),
			hasPlannedExpense: events.some(
				(event) => event.type === EventType.EXPENSE,
			),
		},
		onboarding,
	)
}
