import { stripePaymentProvider } from "./stripe-provider"
import type { PaymentProvider } from "./types"

import { env } from "@/lib/env"
import { BillingProvider, isBillingProvider } from "@/lib/billing-provider"

const providers: Record<BillingProvider, PaymentProvider> = {
	[BillingProvider.STRIPE]: stripePaymentProvider,
}

export function getPaymentProvider(
	providerId: string = env.BILLING_PROVIDER,
): PaymentProvider {
	if (!isBillingProvider(providerId)) {
		throw new Error(`Payment provider ${providerId} is not supported`)
	}
	const provider = providers[providerId]
	if (!provider)
		throw new Error(`Payment provider ${providerId} is not configured`)
	return provider
}

export type {
	PaymentProvider,
	PaymentProviderCheckoutInput,
	PaymentProviderCheckoutResult,
} from "./types"
export { BillingProvider } from "@/lib/billing-provider"
