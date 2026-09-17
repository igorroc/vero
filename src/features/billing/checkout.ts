"use server"

import { headers } from "next/headers"

import { getUserBySession } from "@/lib/auth"
import prisma from "@/lib/db"

import { getPaymentProvider } from "./providers"
import { getApplicationUrl } from "./urls"

export type BillingActionResult =
	| { success: true; url: string }
	| { success: false; error: string }

export async function createPlusCheckoutSession(): Promise<BillingActionResult> {
	const user = await getUserBySession()
	if (!user) return { success: false, error: "Not authenticated" }

	const existingSubscription = await prisma.subscription.findFirst({
		where: {
			userId: user.id,
			status: { in: ["ACTIVE", "CANCELING", "PAST_DUE"] },
		},
		orderBy: { createdAt: "desc" },
	})
	if (existingSubscription) {
		return { success: false, error: "An active subscription already exists" }
	}

	const provider = getPaymentProvider()
	const billingCustomer = await prisma.billingCustomer.findUnique({
		where: { userId_provider: { userId: user.id, provider: provider.id } },
		select: { providerCustomerId: true },
	})
	const origin = getApplicationUrl((await headers()).get("origin"))
	const checkout = await provider.createCheckout({
		user: { id: user.id, email: user.email, name: user.name },
		providerCustomerId: billingCustomer?.providerCustomerId ?? null,
		plan: "PLUS",
		successUrl: `${origin}/profile?checkout=success`,
		cancelUrl: `${origin}/profile?checkout=canceled`,
	})

	if (!billingCustomer) {
		await prisma.billingCustomer.create({
			data: {
				userId: user.id,
				provider: provider.id,
				providerCustomerId: checkout.providerCustomerId,
			},
		})
	}

	return { success: true, url: checkout.url }
}

export async function createBillingPortalSession(): Promise<BillingActionResult> {
	const user = await getUserBySession()
	if (!user) return { success: false, error: "Not authenticated" }

	const latestSubscription = await prisma.subscription.findFirst({
		where: { userId: user.id },
		select: { provider: true },
		orderBy: { createdAt: "desc" },
	})
	const provider = getPaymentProvider(latestSubscription?.provider)
	const billingCustomer = await prisma.billingCustomer.findUnique({
		where: { userId_provider: { userId: user.id, provider: provider.id } },
		select: { providerCustomerId: true },
	})
	if (!billingCustomer) {
		return { success: false, error: "No billing customer was found" }
	}

	const origin = getApplicationUrl((await headers()).get("origin"))
	const url = await provider.createCustomerPortal({
		providerCustomerId: billingCustomer.providerCustomerId,
		returnUrl: `${origin}/profile`,
	})

	return { success: true, url }
}
