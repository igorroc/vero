import type { AccessPlan } from "../access"
import type { BillingProvider } from "@/lib/billing-provider"

export type PaymentProviderCheckoutInput = {
	user: { id: string; name: string; email: string }
	providerCustomerId: string | null
	plan: Exclude<AccessPlan, "FREE">
	providerPriceId: string
	successUrl: string
	cancelUrl: string
}

export type PaymentProviderCheckoutResult = {
	providerCustomerId: string
	providerCheckoutId: string
	url: string
	expiresAt: Date
}

export type PaymentProviderPrice = {
	amountCents: number
	currency: string
	providerProductId: string
}

export type PaymentProvider = {
	id: BillingProvider
	createCheckout(
		input: PaymentProviderCheckoutInput,
	): Promise<PaymentProviderCheckoutResult>
	getPrice(providerPriceId: string): Promise<PaymentProviderPrice>
	createCustomerPortal(input: {
		providerCustomerId: string
		returnUrl: string
	}): Promise<string>
}
