import { stripePaymentProvider } from "./stripe-provider"
import type { PaymentProvider } from "./types"

import { env } from "@/lib/env"

const providers: Record<string, PaymentProvider> = {
	stripe: stripePaymentProvider,
}

export function getPaymentProvider(
	providerId: string = env.BILLING_PROVIDER,
): PaymentProvider {
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
