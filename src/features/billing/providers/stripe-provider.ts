import { getStripe } from "@/lib/stripe"
import { BillingProvider } from "@/lib/billing-provider"

import type {
	PaymentProvider,
	PaymentProviderCheckoutInput,
	PaymentProviderCheckoutResult,
	PaymentProviderPrice,
} from "./types"

async function createCheckout(
	input: PaymentProviderCheckoutInput,
): Promise<PaymentProviderCheckoutResult> {
	const stripe = getStripe()
	const providerCustomerId =
		input.providerCustomerId ??
		(
			await stripe.customers.create({
				email: input.user.email,
				name: input.user.name,
				metadata: { userId: input.user.id },
			})
		).id
	const session = await stripe.checkout.sessions.create({
		mode: "subscription",
		customer: providerCustomerId,
		client_reference_id: input.user.id,
		payment_method_types: ["card"],
		line_items: [{ price: input.providerPriceId, quantity: 1 }],
		success_url: input.successUrl,
		cancel_url: input.cancelUrl,
		subscription_data: { metadata: { userId: input.user.id } },
	})

	if (!session.url) throw new Error("Stripe did not return a checkout URL")
	return {
		providerCustomerId,
		providerCheckoutId: session.id,
		url: session.url,
		expiresAt: new Date(session.expires_at * 1000),
	}
}

async function createCustomerPortal(input: {
	providerCustomerId: string
	userId: string
	returnUrl: string
}): Promise<string> {
	const session = await getStripe().billingPortal.sessions.create({
		customer: input.providerCustomerId,
		return_url: input.returnUrl,
	})
	return session.url
}

async function getPrice(
	providerPriceId: string,
): Promise<PaymentProviderPrice> {
	const price = await getStripe().prices.retrieve(providerPriceId)
	const providerProductId =
		typeof price.product === "string" ? price.product : price.product.id
	if (
		!price.active ||
		price.type !== "recurring" ||
		price.recurring?.interval !== "month"
	) {
		throw new Error("Stripe price must be an active monthly recurring price")
	}
	if (price.unit_amount === null || price.unit_amount <= 0) {
		throw new Error("Stripe price must have a positive fixed amount")
	}

	return {
		amountCents: price.unit_amount,
		currency: price.currency.toUpperCase(),
		providerProductId,
	}
}

export const stripePaymentProvider: PaymentProvider = {
	id: BillingProvider.STRIPE,
	createCheckout,
	getPrice,
	createCustomerPortal,
}
