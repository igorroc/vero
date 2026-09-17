import { stripePaymentProvider } from "./stripe-provider"
import type { PaymentProvider } from "./types"

const providers: Record<string, PaymentProvider> = {
	stripe: stripePaymentProvider,
}

export function getPaymentProvider(providerId = process.env.BILLING_PROVIDER ?? "stripe"): PaymentProvider {
	const provider = providers[providerId]
	if (!provider) throw new Error(`Payment provider ${providerId} is not configured`)
	return provider
}

export type { PaymentProvider, PaymentProviderCheckoutInput, PaymentProviderCheckoutResult } from "./types"
