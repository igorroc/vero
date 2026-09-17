"use server"

import { getUserBySession } from "@/lib/auth"
import prisma from "@/lib/db"

import { resolveAccessPlan, type AccessPlan } from "./access"
import { capabilityCatalog } from "./capabilities"
import { getActiveCommercialOffer } from "./commercial-catalog"
import { getPaymentProvider } from "./providers"

export type CurrentBillingState = {
	plan: "FREE" | "PLUS"
	hasBillingCustomer: boolean
	plusOffer: { amountCents: number; currency: string } | null
	subscription: {
		status: "ACTIVE" | "CANCELING" | "PAST_DUE" | "UNPAID" | "CANCELED"
		currentPeriodEnd: Date
		cancelAtPeriodEnd: boolean
	} | null
	features: string[]
}

export async function getCurrentBillingState(): Promise<CurrentBillingState | null> {
	const user = await getUserBySession()
	if (!user) return null

	const [storedUser, entitlements, plusOffer, subscription] = await Promise.all(
		[
			prisma.user.findUnique({
				where: { id: user.id },
				select: { billingCustomers: { select: { id: true } } },
			}),
			prisma.entitlement.findMany({
				where: { userId: user.id, status: "ACTIVE" },
				select: {
					id: true,
					plan: true,
					source: true,
					startsAt: true,
					endsAt: true,
				},
			}),
			getActiveCommercialOffer(getPaymentProvider().id, "PLUS"),
			prisma.subscription.findFirst({
				where: { userId: user.id },
				orderBy: { currentPeriodEnd: "desc" },
				select: {
					status: true,
					currentPeriodEnd: true,
					cancelAtPeriodEnd: true,
				},
			}),
		],
	)

	if (!storedUser) return null
	const plan = resolveAccessPlan(entitlements)
	const configuredCapabilities = await prisma.planCapability.findMany({
		where: { plan },
		select: { capability: true, isEnabled: true },
	})
	const configuredByCapability = new Map(
		configuredCapabilities.map((item) => [item.capability, item.isEnabled]),
	)
	const features = Object.entries(capabilityCatalog)
		.filter(([capability, definition]) => {
			return (
				configuredByCapability.get(capability) ??
				definition.defaults[plan as AccessPlan].isEnabled
			)
		})
		.map(([, definition]) => definition.description)

	return {
		plan,
		hasBillingCustomer: storedUser.billingCustomers.length > 0,
		plusOffer: plusOffer
			? { amountCents: plusOffer.amountCents, currency: plusOffer.currency }
			: null,
		subscription,
		features,
	}
}
