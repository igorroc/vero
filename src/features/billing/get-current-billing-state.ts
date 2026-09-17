"use server"

import { getUserBySession } from "@/lib/auth"
import prisma from "@/lib/db"

import { resolveAccessPlan } from "./access"

export type CurrentBillingState = {
	plan: "FREE" | "PLUS"
	hasBillingCustomer: boolean
}

export async function getCurrentBillingState(): Promise<CurrentBillingState | null> {
	const user = await getUserBySession()
	if (!user) return null

	const [storedUser, entitlements] = await Promise.all([
		prisma.user.findUnique({
			where: { id: user.id },
			select: { billingCustomers: { select: { id: true } } },
		}),
		prisma.entitlement.findMany({
			where: { userId: user.id, status: "ACTIVE" },
			select: { id: true, plan: true, source: true, startsAt: true, endsAt: true },
		}),
	])

	if (!storedUser) return null
	return {
		plan: resolveAccessPlan(entitlements),
		hasBillingCustomer: storedUser.billingCustomers.length > 0,
	}
}
