import prisma from "@/lib/db"
import type { BillingProvider } from "@/lib/billing-provider"

import type { AccessPlan } from "./access"

export async function getActiveCommercialOffer(
	provider: BillingProvider,
	plan: Exclude<AccessPlan, "FREE">,
) {
	return prisma.commercialOffer.findFirst({
		where: {
			provider,
			plan,
			isActive: true,
			effectiveAt: { lte: new Date() },
		},
		orderBy: [{ effectiveAt: "desc" }, { createdAt: "desc" }],
	})
}

export async function getCommercialOfferByProviderPrice(
	provider: BillingProvider,
	providerPriceId: string,
) {
	return prisma.commercialOffer.findUnique({
		where: { provider_providerPriceId: { provider, providerPriceId } },
	})
}
