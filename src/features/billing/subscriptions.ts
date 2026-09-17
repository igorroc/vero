import { Prisma } from "@prisma/client"

import prisma from "@/lib/db"
import type { BillingProvider } from "@/lib/billing-provider"

export type ProviderSubscription = {
	providerCustomerId: string
	providerSubscriptionId: string
	providerPriceId: string
	userId?: string
	plan: "PLUS"
	status: "ACTIVE" | "CANCELING" | "PAST_DUE" | "UNPAID" | "CANCELED"
	currentPeriodStart: Date
	currentPeriodEnd: Date
	cancelAtPeriodEnd: boolean
	canceledAt: Date | null
}

export async function synchronizeProviderSubscription(
	provider: BillingProvider,
	providerSubscription: ProviderSubscription,
): Promise<void> {
	const {
		userId: _providerUserId,
		currentPeriodStart,
		...subscriptionData
	} = providerSubscription

	await prisma.$transaction(async (tx) => {
		const existing = await tx.subscription.findUnique({
			where: {
				provider_providerSubscriptionId: {
					provider,
					providerSubscriptionId: providerSubscription.providerSubscriptionId,
				},
			},
		})
		const userId = existing?.userId ?? providerSubscription.userId
		if (!userId) {
			throw new Error(
				`Subscription ${providerSubscription.providerSubscriptionId} has no Vero user`,
			)
		}

		await tx.billingCustomer.upsert({
			where: { userId_provider: { userId, provider } },
			create: { userId, provider, providerCustomerId: providerSubscription.providerCustomerId },
			update: { providerCustomerId: providerSubscription.providerCustomerId },
		})

		const subscription = await tx.subscription.upsert({
			where: {
				provider_providerSubscriptionId: {
					provider,
					providerSubscriptionId: providerSubscription.providerSubscriptionId,
				},
			},
			create: { userId, provider, ...subscriptionData },
			update: subscriptionData,
		})

		const accessRemainsActive =
			providerSubscription.status !== "CANCELED" &&
			providerSubscription.status !== "UNPAID"
		const entitlementEndsAt =
			providerSubscription.status === "PAST_DUE"
				? null
				: providerSubscription.currentPeriodEnd

		await tx.entitlement.upsert({
			where: { subscriptionId: subscription.id },
			create: {
				userId,
				plan: providerSubscription.plan,
				source: "INDIVIDUAL_SUBSCRIPTION",
				status: accessRemainsActive ? "ACTIVE" : "EXPIRED",
				startsAt: currentPeriodStart,
				endsAt: accessRemainsActive ? entitlementEndsAt : new Date(),
				subscriptionId: subscription.id,
			},
			update: {
				status: accessRemainsActive ? "ACTIVE" : "EXPIRED",
				endsAt: accessRemainsActive ? entitlementEndsAt : new Date(),
			},
		})
	})
}

export async function processPaymentWebhookEvent(input: {
	provider: BillingProvider
	providerEventId: string
	type: string
	payload: Prisma.InputJsonValue
	process: () => Promise<void>
}): Promise<void> {
	const existing = await prisma.paymentWebhookEvent.findUnique({
		where: {
			provider_providerEventId: {
				provider: input.provider,
				providerEventId: input.providerEventId,
			},
		},
	})
	if (existing?.processedAt) return

	if (!existing) {
		try {
			await prisma.paymentWebhookEvent.create({
				data: {
					provider: input.provider,
					providerEventId: input.providerEventId,
					type: input.type,
					payload: input.payload,
				},
			})
		} catch (error) {
			if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
				throw error
			}
		}
	}

	try {
		await input.process()
		await prisma.paymentWebhookEvent.update({
			where: {
				provider_providerEventId: {
					provider: input.provider,
					providerEventId: input.providerEventId,
				},
			},
			data: { processedAt: new Date(), processingError: null },
		})
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unknown processing error"
		await prisma.paymentWebhookEvent.update({
			where: {
				provider_providerEventId: {
					provider: input.provider,
					providerEventId: input.providerEventId,
				},
			},
			data: { processingError: message },
		})
		throw error
	}
}
