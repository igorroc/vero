"use server"

import { resolveAccessPlan, type AccessPlan } from "@/features/billing/access"
import prisma from "@/lib/db"

import { requireSuperAdmin } from "./require-super-admin"

export type AdminUser = {
	id: string
	name: string
	email: string
	createdAt: Date
	plan: AccessPlan
	benefitSource: string | null
	subscription: {
		plan: AccessPlan
		status: "ACTIVE" | "CANCELING" | "PAST_DUE" | "UNPAID" | "CANCELED"
		currentPeriodEnd: Date
		cancelAtPeriodEnd: boolean
	} | null
}

export async function getAdminUsers(): Promise<AdminUser[]> {
	await requireSuperAdmin()

	const now = new Date()
	const users = await prisma.user.findMany({
		select: {
			id: true,
			name: true,
			email: true,
			createdAt: true,
			entitlements: {
				where: { status: "ACTIVE" },
				select: {
					id: true,
					plan: true,
					source: true,
					startsAt: true,
					endsAt: true,
				},
			},
			subscriptions: {
				orderBy: { updatedAt: "desc" },
				take: 1,
				select: {
					plan: true,
					status: true,
					currentPeriodEnd: true,
					cancelAtPeriodEnd: true,
				},
			},
		},
		orderBy: { createdAt: "desc" },
	})

	return users.map((user) => {
		const activeEntitlements = user.entitlements.filter(
			(entitlement) =>
				entitlement.startsAt <= now &&
				(entitlement.endsAt === null || entitlement.endsAt > now),
		)
		const plan = resolveAccessPlan(activeEntitlements, now)
		const activePlusEntitlement = activeEntitlements.find(
			(entitlement) => entitlement.plan === plan && plan !== "FREE",
		)
		const subscription = user.subscriptions[0] ?? null

		return {
			id: user.id,
			name: user.name,
			email: user.email,
			createdAt: user.createdAt,
			plan,
			benefitSource: activePlusEntitlement?.source ?? null,
			subscription,
		}
	})
}
