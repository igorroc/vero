export enum BillingProvider {
	POLAR = "polar",
	STRIPE = "stripe",
}

export function isBillingProvider(value: string): value is BillingProvider {
	return Object.values(BillingProvider).includes(value as BillingProvider)
}
