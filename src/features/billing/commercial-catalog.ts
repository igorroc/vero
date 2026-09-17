import prisma from "@/lib/db"

import type { AccessPlan } from "./access"

export async function getActiveCommercialOffer(
	provider: string,
	plan: Exclude<AccessPlan, "FREE">,
) {
	return prisma.commercialOffer.findFirst({
		where: {
			provider,
			plan,
			isActive: true,
			effectiveAt: { lte: new Date() },
		},
		orderBy: { effectiveAt: "desc" },
	})
}

export async function getCommercialOfferByProviderPrice(
	provider: string,
	providerPriceId: string,
) {
	return prisma.commercialOffer.findUnique({
		where: { provider_providerPriceId: { provider, providerPriceId } },
	})
}
