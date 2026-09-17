"use server"

import { getUserBySession } from "@/lib/auth"
import prisma from "@/lib/db"

import { resolveAccessPlan } from "./access"
import { getActiveCommercialOffer } from "./commercial-catalog"

export type CurrentBillingState = {
	plan: "FREE" | "PLUS"
	hasBillingCustomer: boolean
	plusOffer: { amountCents: number; currency: string } | null
}

export async function getCurrentBillingState(): Promise<CurrentBillingState | null> {
	const user = await getUserBySession()
	if (!user) return null

	const [storedUser, entitlements, plusOffer] = await Promise.all([
		prisma.user.findUnique({
			where: { id: user.id },
			select: { billingCustomers: { select: { id: true } } },
		}),
		prisma.entitlement.findMany({
			where: { userId: user.id, status: "ACTIVE" },
			select: { id: true, plan: true, source: true, startsAt: true, endsAt: true },
		}),
		getActiveCommercialOffer("stripe", "PLUS"),
	])

	if (!storedUser) return null
	return {
		plan: resolveAccessPlan(entitlements),
		hasBillingCustomer: storedUser.billingCustomers.length > 0,
		plusOffer: plusOffer
			? { amountCents: plusOffer.amountCents, currency: plusOffer.currency }
			: null,
	}
}
