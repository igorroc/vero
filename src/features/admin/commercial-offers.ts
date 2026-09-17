"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import prisma from "@/lib/db"
import { BillingProvider, isBillingProvider } from "@/lib/billing-provider"

import { getPaymentProvider } from "@/features/billing/providers"

import { requireSuperAdmin } from "./require-super-admin"

const commercialOfferSchema = z.object({
	provider: z.string().refine(isBillingProvider),
	providerPriceId: z.string().trim().min(1),
	effectiveAt: z.string().datetime(),
})

export async function getCommercialOffers() {
	await requireSuperAdmin()

	return prisma.commercialOffer.findMany({
		where: { plan: "PLUS" },
		include: { createdByUser: { select: { name: true, email: true } } },
		orderBy: { effectiveAt: "desc" },
	})
}

export async function createCommercialOffer(input: {
	provider: BillingProvider
	providerPriceId: string
	effectiveAt: string
}): Promise<{ success: boolean; error?: string }> {
	const admin = await requireSuperAdmin()
	const parsed = commercialOfferSchema.safeParse(input)
	if (!parsed.success)
		return { success: false, error: "Dados da oferta inválidos." }

	const effectiveAt = new Date(parsed.data.effectiveAt)
	let price
	try {
		price = await getPaymentProvider(parsed.data.provider).getPrice(
			parsed.data.providerPriceId,
		)
	} catch (error) {
		console.error("Failed to validate provider price", error)
		return {
			success: false,
			error: "O produto do provedor precisa ser mensal e ativo.",
		}
	}

	try {
		await prisma.commercialOffer.create({
			data: {
				plan: "PLUS",
				amountCents: price.amountCents,
				currency: price.currency,
				provider: parsed.data.provider,
				providerProductId: price.providerProductId,
				providerPriceId: parsed.data.providerPriceId,
				effectiveAt,
				createdByUserId: admin.id,
			},
		})
	} catch (error) {
		if (error instanceof Error && error.message.includes("Unique constraint")) {
			return {
				success: false,
				error: "Já existe uma oferta com este preço ou esta vigência.",
			}
		}
		throw error
	}

	revalidatePath("/admin/plans")
	revalidatePath("/admin/dashboard")
	revalidatePath("/profile")
	return { success: true }
}

export async function deactivateCommercialOffer(
	offerId: string,
): Promise<{ success: boolean; error?: string }> {
	await requireSuperAdmin()
	if (!offerId) return { success: false, error: "Oferta inválida." }

	await prisma.commercialOffer.updateMany({
		where: { id: offerId, isActive: true },
		data: { isActive: false, deactivatedAt: new Date() },
	})

	revalidatePath("/admin/plans")
	revalidatePath("/admin/dashboard")
	revalidatePath("/profile")
	return { success: true }
}
