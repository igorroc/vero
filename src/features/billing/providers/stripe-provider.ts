import { getStripe } from "@/lib/stripe"

import type {
	PaymentProvider,
	PaymentProviderCheckoutInput,
	PaymentProviderCheckoutResult,
} from "./types"

async function createCheckout(
	input: PaymentProviderCheckoutInput,
): Promise<PaymentProviderCheckoutResult> {
	const priceId = process.env.STRIPE_PLUS_PRICE_ID
	if (!priceId) throw new Error("STRIPE_PLUS_PRICE_ID is not configured")

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
		line_items: [{ price: priceId, quantity: 1 }],
		success_url: input.successUrl,
		cancel_url: input.cancelUrl,
		subscription_data: { metadata: { userId: input.user.id } },
	})

	if (!session.url) throw new Error("Stripe did not return a checkout URL")
	return { providerCustomerId, url: session.url }
}

async function createCustomerPortal(input: {
	providerCustomerId: string
	returnUrl: string
}): Promise<string> {
	const session = await getStripe().billingPortal.sessions.create({
		customer: input.providerCustomerId,
		return_url: input.returnUrl,
	})
	return session.url
}

export const stripePaymentProvider: PaymentProvider = {
	id: "stripe",
	createCheckout,
	createCustomerPortal,
}
