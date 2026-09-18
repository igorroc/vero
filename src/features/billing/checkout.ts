"use server"

import { headers } from "next/headers"
import { Prisma } from "@prisma/client"

import { getUserBySession } from "@/lib/auth"
import type { BillingProvider } from "@/lib/billing-provider"
import prisma from "@/lib/db"

import { getPaymentProvider } from "./providers"
import { getActiveCommercialOffer } from "./commercial-catalog"
import { getApplicationUrl } from "./urls"

export type BillingActionResult =
	{ success: true; url: string } | { success: false; error: string }

export async function createPlusCheckoutSession(): Promise<BillingActionResult> {
	const user = await getUserBySession()
	if (!user) return { success: false, error: "Not authenticated" }

	const provider = getPaymentProvider()
	const offer = await getActiveCommercialOffer(provider.id, "PLUS")
	if (!offer) {
		return {
			success: false,
			error: "O Vero Plus não está disponível para contratação.",
		}
	}

	const reservation = await reserveCheckout(user.id, provider.id)
	if ("result" in reservation) return reservation.result

	const origin = getApplicationUrl((await headers()).get("origin"))
	try {
		const checkout = await provider.createCheckout({
			user: { id: user.id, email: user.email, name: user.name },
			providerCustomerId: reservation.providerCustomerId,
			plan: "PLUS",
			providerPriceId: offer.providerPriceId,
			successUrl: `${origin}/profile?checkout=success`,
			cancelUrl: `${origin}/profile?checkout=canceled`,
		})

		await prisma.$transaction([
			...(checkout.providerCustomerId
				? [
						prisma.billingCustomer.upsert({
							where: {
								userId_provider: { userId: user.id, provider: provider.id },
							},
							create: {
								userId: user.id,
								provider: provider.id,
								providerCustomerId: checkout.providerCustomerId,
							},
							update: { providerCustomerId: checkout.providerCustomerId },
						}),
					]
				: []),
			prisma.billingCheckout.update({
				where: { id: reservation.id },
				data: {
					providerCheckoutId: checkout.providerCheckoutId,
					url: checkout.url,
					expiresAt: checkout.expiresAt,
				},
			}),
		])

		return { success: true, url: checkout.url }
	} catch (error) {
		await prisma.billingCheckout.deleteMany({
			where: { id: reservation.id, userId: user.id, provider: provider.id },
		})
		console.error("Failed to create billing checkout session", error)
		return {
			success: false,
			error:
				"Não foi possível iniciar o pagamento. Tente novamente em alguns minutos.",
		}
	}
}

async function reserveCheckout(
	userId: string,
	provider: BillingProvider,
): Promise<
	| { id: string; providerCustomerId: string | null }
	| { result: BillingActionResult }
> {
	const now = new Date()
	await prisma.billingCheckout.deleteMany({
		where: { provider, expiresAt: { lte: now } },
	})

	const [existingSubscription, checkout, billingCustomer] = await Promise.all([
		prisma.subscription.findFirst({
			where: { userId, status: { in: ["ACTIVE", "CANCELING", "PAST_DUE"] } },
			select: { id: true },
		}),
		prisma.billingCheckout.findUnique({
			where: { userId_provider: { userId, provider } },
			select: { id: true, url: true },
		}),
		prisma.billingCustomer.findUnique({
			where: { userId_provider: { userId, provider } },
			select: { providerCustomerId: true },
		}),
	])
	if (existingSubscription) {
		return {
			result: {
				success: false,
				error: "An active subscription already exists",
			},
		}
	}
	if (checkout?.url) return { result: { success: true, url: checkout.url } }
	if (checkout) {
		return {
			result: {
				success: false,
				error: "A checkout session is already being created",
			},
		}
	}

	try {
		const reservation = await prisma.billingCheckout.create({
			data: {
				userId,
				provider,
				expiresAt: new Date(now.getTime() + 5 * 60_000),
			},
			select: { id: true },
		})
		return {
			id: reservation.id,
			providerCustomerId: billingCustomer?.providerCustomerId ?? null,
		}
	} catch (error) {
		if (
			!(error instanceof Prisma.PrismaClientKnownRequestError) ||
			error.code !== "P2002"
		) {
			throw error
		}
		const concurrentCheckout = await prisma.billingCheckout.findUnique({
			where: { userId_provider: { userId, provider } },
			select: { url: true },
		})
		return concurrentCheckout?.url
			? { result: { success: true, url: concurrentCheckout.url } }
			: {
					result: {
						success: false,
						error: "A checkout session is already being created",
					},
				}
	}
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
		userId: user.id,
		returnUrl: `${origin}/profile`,
	})

	return { success: true, url }
}
