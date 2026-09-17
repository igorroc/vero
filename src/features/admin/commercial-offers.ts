"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import prisma from "@/lib/db"
import { BillingProvider } from "@/lib/billing-provider"

import { requireSuperAdmin } from "./require-super-admin"

const commercialOfferSchema = z.object({
	amountCents: z.number().int().positive(),
	currency: z
		.string()
		.trim()
		.regex(/^[A-Za-z]{3}$/),
	providerProductId: z.string().trim().min(1),
	providerPriceId: z.string().trim().min(1),
	effectiveAt: z.string().datetime(),
})

export async function getCommercialOffers() {
	await requireSuperAdmin()

	return prisma.commercialOffer.findMany({
		where: { plan: "PLUS", provider: BillingProvider.STRIPE },
		include: { createdByUser: { select: { name: true, email: true } } },
		orderBy: { effectiveAt: "desc" },
	})
}

export async function createCommercialOffer(input: {
	amountCents: number
	currency: string
	providerProductId: string
	providerPriceId: string
	effectiveAt: string
}): Promise<{ success: boolean; error?: string }> {
	const admin = await requireSuperAdmin()
	const parsed = commercialOfferSchema.safeParse(input)
	if (!parsed.success)
		return { success: false, error: "Dados da oferta inválidos." }

	const effectiveAt = new Date(parsed.data.effectiveAt)

	try {
		await prisma.commercialOffer.create({
			data: {
				plan: "PLUS",
				amountCents: parsed.data.amountCents,
				currency: parsed.data.currency.toUpperCase(),
				provider: BillingProvider.STRIPE,
				providerProductId: parsed.data.providerProductId,
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

	revalidatePath("/admin")
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

	revalidatePath("/admin")
	revalidatePath("/profile")
	return { success: true }
}
