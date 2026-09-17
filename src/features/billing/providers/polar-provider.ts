import { BillingProvider } from "@/lib/billing-provider"
import { getPolar } from "@/lib/polar"

import type {
	PaymentProvider,
	PaymentProviderCheckoutInput,
	PaymentProviderCheckoutResult,
	PaymentProviderPrice,
} from "./types"

type PolarProduct = Awaited<
	ReturnType<ReturnType<typeof getPolar>["products"]["get"]>
>
type PolarFixedPrice = Extract<
	PolarProduct["prices"][number],
	{ amount_type: "fixed" }
>

function isActiveFixedPrice(
	price: PolarProduct["prices"][number],
): price is PolarFixedPrice {
	return price.amount_type === "fixed" && !price.is_archived
}

async function createCheckout(
	input: PaymentProviderCheckoutInput,
): Promise<PaymentProviderCheckoutResult> {
	const checkout = await getPolar().checkouts.create({
		products: [input.providerPriceId],
		external_customer_id: input.user.id,
		customer_name: input.user.name,
		customer_email: input.user.email,
		metadata: { userId: input.user.id, plan: input.plan },
		customer_metadata: { userId: input.user.id },
		success_url: `${input.successUrl}${input.successUrl.includes("?") ? "&" : "?"}checkout_id={CHECKOUT_ID}`,
		return_url: input.cancelUrl,
		allow_trial: false,
	})

	return {
		providerCustomerId: checkout.customer_id,
		providerCheckoutId: checkout.id,
		url: checkout.url,
		expiresAt: new Date(checkout.expires_at),
	}
}

async function createCustomerPortal(input: {
	providerCustomerId: string
	userId: string
	returnUrl: string
}): Promise<string> {
	const session = await getPolar().customerSessions.create({
		external_customer_id: input.userId,
		return_url: input.returnUrl,
	})
	return session.customer_portal_url
}

async function getPrice(
	providerPriceId: string,
): Promise<PaymentProviderPrice> {
	const product = await getPolar().products.get(providerPriceId)
	const price = product.prices.find(isActiveFixedPrice)
	if (
		!product.is_recurring ||
		product.is_archived ||
		product.recurring_interval !== "month" ||
		product.recurring_interval_count !== 1 ||
		!price ||
		price.price_amount <= 0
	) {
		throw new Error("Polar product must have an active fixed monthly price")
	}

	return {
		amountCents: price.price_amount,
		currency: price.price_currency.toUpperCase(),
		providerProductId: product.id,
	}
}

export const polarPaymentProvider: PaymentProvider = {
	id: BillingProvider.POLAR,
	createCheckout,
	getPrice,
	createCustomerPortal,
}
