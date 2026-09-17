"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import {
	capabilityCatalog,
	type AccessPlan,
	type Capability,
} from "@/features/billing"
import prisma from "@/lib/db"

import { requireSuperAdmin } from "./require-super-admin"

const capabilityConfigurationSchema = z.object({
	plan: z.enum(["FREE", "PLUS"]),
	capability: z.enum(
		Object.keys(capabilityCatalog) as [Capability, ...Capability[]],
	),
	isEnabled: z.boolean(),
	limit: z.number().int().min(0).nullable(),
})

export type PlanCapabilityConfiguration = {
	plan: AccessPlan
	capability: Capability
	description: string
	type: "BOOLEAN" | "LIMIT"
	isEnabled: boolean
	limit: number | null
}

export async function getPlanCapabilityConfigurations(): Promise<
	PlanCapabilityConfiguration[]
> {
	await requireSuperAdmin()
	const configurations = await prisma.planCapability.findMany({
		where: { capability: { in: Object.keys(capabilityCatalog) } },
		select: { plan: true, capability: true, isEnabled: true, limit: true },
	})

	return (["FREE", "PLUS"] as const).flatMap((plan) =>
		(
			Object.entries(capabilityCatalog) as [
				Capability,
				(typeof capabilityCatalog)[Capability],
			][]
		).map(([capability, definition]) => {
			const configured = configurations.find(
				(configuration) =>
					configuration.plan === plan &&
					configuration.capability === capability,
			)
			const fallback = definition.defaults[plan]
			return {
				plan,
				capability,
				description: definition.description,
				type: definition.type,
				isEnabled: configured?.isEnabled ?? fallback.isEnabled,
				limit: configured?.limit ?? fallback.limit,
			}
		}),
	)
}

export async function updatePlanCapability(
	input: Omit<PlanCapabilityConfiguration, "description" | "type">,
): Promise<{ success: boolean; error?: string }> {
	await requireSuperAdmin()
	const parsed = capabilityConfigurationSchema.safeParse(input)
	if (!parsed.success) {
		return { success: false, error: "Configuração de capacidade inválida." }
	}

	const { plan, capability, isEnabled, limit } = parsed.data
	const definition = capabilityCatalog[capability]
	if (definition.type === "BOOLEAN" && limit !== null) {
		return { success: false, error: "Esta capacidade não aceita limite." }
	}

	await prisma.planCapability.upsert({
		where: { plan_capability: { plan, capability } },
		create: { plan, capability, isEnabled, limit },
		update: { isEnabled, limit },
	})

	revalidatePath("/admin/plans")
	return { success: true }
}
