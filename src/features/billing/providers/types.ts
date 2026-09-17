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
	url: string
}

export type PaymentProvider = {
	id: BillingProvider
	createCheckout(input: PaymentProviderCheckoutInput): Promise<PaymentProviderCheckoutResult>
	createCustomerPortal(input: { providerCustomerId: string; returnUrl: string }): Promise<string>
}
