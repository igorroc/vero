import type Stripe from "stripe"
import { Prisma } from "@prisma/client"

import {
	processPaymentWebhookEvent,
	synchronizeProviderSubscription,
	type ProviderSubscription,
} from "./subscriptions"
import { getCommercialOfferByProviderPrice } from "./commercial-catalog"

function getSubscriptionStatus(
	subscription: Stripe.Subscription,
): ProviderSubscription["status"] {
	if (subscription.status === "canceled") return "CANCELED"
	if (subscription.status === "unpaid") return "UNPAID"
	if (subscription.status === "past_due") return "PAST_DUE"
	if (subscription.cancel_at_period_end) return "CANCELING"
	return "ACTIVE"
}

function getPeriodEnd(subscription: Stripe.Subscription): Date {
	const periodEnd = subscription.items.data[0]?.current_period_end
	if (!periodEnd)
		throw new Error(`Stripe subscription ${subscription.id} has no period end`)
	return new Date(periodEnd * 1000)
}

function getPeriodStart(subscription: Stripe.Subscription): Date {
	const periodStart = subscription.items.data[0]?.current_period_start
	if (!periodStart)
		throw new Error(
			`Stripe subscription ${subscription.id} has no period start`,
		)
	return new Date(periodStart * 1000)
}

function getCustomerId(subscription: Stripe.Subscription): string {
	return typeof subscription.customer === "string"
		? subscription.customer
		: subscription.customer.id
}

export async function synchronizeStripeSubscription(
	stripeSubscription: Stripe.Subscription,
): Promise<void> {
	const providerPriceId = stripeSubscription.items.data[0]?.price.id
	if (!providerPriceId) return
	const offer = await getCommercialOfferByProviderPrice("stripe", providerPriceId)
	if (!offer || offer.plan !== "PLUS") return

	await synchronizeProviderSubscription("stripe", {
		providerCustomerId: getCustomerId(stripeSubscription),
		providerSubscriptionId: stripeSubscription.id,
		providerPriceId,
		userId: stripeSubscription.metadata.userId,
		plan: offer.plan,
		status: getSubscriptionStatus(stripeSubscription),
		currentPeriodStart: getPeriodStart(stripeSubscription),
		currentPeriodEnd: getPeriodEnd(stripeSubscription),
		cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
		canceledAt: stripeSubscription.canceled_at
			? new Date(stripeSubscription.canceled_at * 1000)
			: null,
	})
}

export async function processStripeWebhookEvent(
	event: Stripe.Event,
): Promise<void> {
	await processPaymentWebhookEvent({
		provider: "stripe",
		providerEventId: event.id,
		type: event.type,
		payload: event as unknown as Prisma.InputJsonValue,
		process: async () => {
			if (
				event.type === "customer.subscription.created" ||
				event.type === "customer.subscription.updated" ||
				event.type === "customer.subscription.deleted"
			) {
				await synchronizeStripeSubscription(
					event.data.object as Stripe.Subscription,
				)
			}
		},
	})
}
