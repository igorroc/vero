import { Prisma } from "@prisma/client"

import { BillingProvider } from "@/lib/billing-provider"
import { getPolar } from "@/lib/polar"

import {
	processPaymentWebhookEvent,
	synchronizeProviderSubscription,
	type ProviderSubscription,
} from "./subscriptions"
import { getCommercialOfferByProviderPrice } from "./commercial-catalog"

type PolarSubscription = Awaited<
	ReturnType<ReturnType<typeof getPolar>["subscriptions"]["get"]>
>
type PolarWebhookEvent = Awaited<
	ReturnType<typeof import("@polar-sh/sdk/2026-04").webhooks.validateEvent>
>

export function mapPolarSubscriptionStatus(
	status: string,
	cancelAtPeriodEnd: boolean,
): ProviderSubscription["status"] {
	switch (status) {
		case "active":
			return cancelAtPeriodEnd ? "CANCELING" : "ACTIVE"
		case "past_due":
			return "PAST_DUE"
		case "canceled":
		case "unpaid":
			return "CANCELED"
		default:
			return "UNPAID"
	}
}

function getUserId(subscription: PolarSubscription): string | undefined {
	const externalId = subscription.customer.external_id
	if (externalId) return externalId

	const userId = subscription.metadata.userId
	return typeof userId === "string" ? userId : undefined
}

export async function synchronizePolarSubscription(
	subscription: PolarSubscription,
	providerUpdatedAt: Date,
): Promise<void> {
	const offer = await getCommercialOfferByProviderPrice(
		BillingProvider.POLAR,
		subscription.product_id,
	)
	if (!offer || offer.plan !== "PLUS") return

	await synchronizeProviderSubscription(BillingProvider.POLAR, {
		providerCustomerId: subscription.customer_id,
		providerSubscriptionId: subscription.id,
		providerPriceId: subscription.product_id,
		userId: getUserId(subscription),
		plan: offer.plan,
		status: mapPolarSubscriptionStatus(
			subscription.status,
			subscription.cancel_at_period_end,
		),
		currentPeriodStart: new Date(subscription.current_period_start),
		currentPeriodEnd: new Date(subscription.current_period_end),
		providerUpdatedAt,
		cancelAtPeriodEnd: subscription.cancel_at_period_end,
		canceledAt: subscription.canceled_at
			? new Date(subscription.canceled_at)
			: null,
	})
}

export async function processPolarWebhookEvent(
	event: PolarWebhookEvent,
	providerEventId: string,
): Promise<void> {
	await processPaymentWebhookEvent({
		provider: BillingProvider.POLAR,
		providerEventId,
		type: event.type,
		payload: event as unknown as Prisma.InputJsonValue,
		process: async () => {
			const providerUpdatedAt = new Date(event.timestamp)
			if (
				event.type === "subscription.active" ||
				event.type === "subscription.canceled" ||
				event.type === "subscription.created" ||
				event.type === "subscription.cycled" ||
				event.type === "subscription.past_due" ||
				event.type === "subscription.paused" ||
				event.type === "subscription.resumed" ||
				event.type === "subscription.revoked" ||
				event.type === "subscription.uncanceled" ||
				event.type === "subscription.updated"
			) {
				await synchronizePolarSubscription(event.data, providerUpdatedAt)
				return
			}
			if (event.type === "customer.state_changed") {
				await Promise.all(
					event.data.active_subscriptions.map(async ({ id }) => {
						const subscription = await getPolar().subscriptions.get(id)
						await synchronizePolarSubscription(subscription, providerUpdatedAt)
					}),
				)
				return
			}
			if (
				event.type === "order.paid" ||
				event.type === "order.updated" ||
				event.type === "order.refunded"
			) {
				if (!event.data.subscription_id) return
				const subscription = await getPolar().subscriptions.get(
					event.data.subscription_id,
				)
				await synchronizePolarSubscription(subscription, providerUpdatedAt)
			}
		},
	})
}
