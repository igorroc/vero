"use server"

import { revalidatePath } from "next/cache"

import { z } from "zod"

import prisma from "@/lib/db"

import { requireSuperAdmin } from "./require-super-admin"

const grantPlanSchema = z.object({
	userId: z.string().min(1),
	plan: z.literal("PLUS"),
	endsAt: z.string().datetime().nullable(),
})

export async function grantPlanToUser(input: {
	userId: string
	plan: "PLUS"
	endsAt: string | null
}): Promise<{ success: boolean; error?: string }> {
	const admin = await requireSuperAdmin()
	const parsed = grantPlanSchema.safeParse(input)
	if (!parsed.success)
		return { success: false, error: "Dados da concessão inválidos." }

	const endsAt = parsed.data.endsAt ? new Date(parsed.data.endsAt) : null
	if (endsAt && endsAt <= new Date()) {
		return { success: false, error: "A validade precisa estar no futuro." }
	}

	const user = await prisma.user.findUnique({
		where: { id: parsed.data.userId },
		select: { id: true },
	})
	if (!user) return { success: false, error: "Usuário não encontrado." }

	await prisma.entitlement.create({
		data: {
			userId: user.id,
			plan: parsed.data.plan,
			source: "ADMINISTRATIVE_GRANT",
			status: "ACTIVE",
			startsAt: new Date(),
			endsAt,
			reason: "Concessão administrativa",
			grantedByUserId: admin.id,
		},
	})

	revalidatePath("/admin/dashboard")
	revalidatePath("/admin/users")
	return { success: true }
}
