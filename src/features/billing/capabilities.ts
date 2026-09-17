import { Prisma, type AccountType, type EventType } from "@prisma/client"

import prisma from "@/lib/db"

import { resolveAccessPlan, type AccessPlan } from "./access"

type CapabilityDefinition = {
	description: string
	type: "BOOLEAN" | "LIMIT"
	defaults: Record<AccessPlan, { isEnabled: boolean; limit: number | null }>
}

export const capabilityCatalog = {
	"accounts.active": {
		description: "Contas financeiras ativas",
		type: "LIMIT",
		defaults: {
			FREE: { isEnabled: true, limit: 1 },
			PLUS: { isEnabled: true, limit: null },
		},
	},
	"events.create.monthly": {
		description: "Lançamentos criados no mês",
		type: "LIMIT",
		defaults: {
			FREE: { isEnabled: true, limit: 30 },
			PLUS: { isEnabled: true, limit: null },
		},
	},
	"categories.manage": {
		description: "Gestão de categorias",
		type: "BOOLEAN",
		defaults: {
			FREE: { isEnabled: true, limit: null },
			PLUS: { isEnabled: true, limit: null },
		},
	},
	"investments.manage": {
		description: "Gestão de investimentos",
		type: "BOOLEAN",
		defaults: {
			FREE: { isEnabled: false, limit: null },
			PLUS: { isEnabled: true, limit: null },
		},
	},
	"investment-plans.manage": {
		description: "Gestão de planos de investimento",
		type: "BOOLEAN",
		defaults: {
			FREE: { isEnabled: false, limit: null },
			PLUS: { isEnabled: true, limit: null },
		},
	},
	"debts.manage": {
		description: "Gestão de dívidas",
		type: "BOOLEAN",
		defaults: {
			FREE: { isEnabled: false, limit: null },
			PLUS: { isEnabled: true, limit: null },
		},
	},
	"debt-payments.manage": {
		description: "Registro de pagamentos de dívidas",
		type: "BOOLEAN",
		defaults: {
			FREE: { isEnabled: false, limit: null },
			PLUS: { isEnabled: true, limit: null },
		},
	},
	"reports.basic": {
		description: "Relatórios básicos",
		type: "BOOLEAN",
		defaults: {
			FREE: { isEnabled: true, limit: null },
			PLUS: { isEnabled: true, limit: null },
		},
	},
	"reports.detailed": {
		description: "Relatórios detalhados",
		type: "BOOLEAN",
		defaults: {
			FREE: { isEnabled: false, limit: null },
			PLUS: { isEnabled: true, limit: null },
		},
	},
	"cashflow.view": {
		description: "Visualização de fluxo de caixa",
		type: "BOOLEAN",
		defaults: {
			FREE: { isEnabled: false, limit: null },
			PLUS: { isEnabled: true, limit: null },
		},
	},
	"spending-limit.view": {
		description: "Visualização do limite diário",
		type: "BOOLEAN",
		defaults: {
			FREE: { isEnabled: false, limit: null },
			PLUS: { isEnabled: true, limit: null },
		},
	},
} as const satisfies Record<string, CapabilityDefinition>

export type Capability = keyof typeof capabilityCatalog

export const initialPlanCapabilities = Object.entries(
	capabilityCatalog,
).flatMap(([capability, definition]) =>
	Object.entries(definition.defaults).map(([plan, configuration]) => ({
		plan: plan as AccessPlan,
		capability,
		...configuration,
	})),
)

type CapabilityClient = Pick<
	Prisma.TransactionClient,
	"entitlement" | "planCapability" | "account" | "event"
>

async function resolveCapability(
	userId: string,
	capability: Capability,
	client: CapabilityClient = prisma,
) {
	const entitlements = await client.entitlement.findMany({
		where: { userId, status: "ACTIVE" },
		select: {
			id: true,
			plan: true,
			source: true,
			startsAt: true,
			endsAt: true,
		},
	})
	const plan = resolveAccessPlan(entitlements)
	const configured = await client.planCapability.findUnique({
		where: { plan_capability: { plan, capability } },
		select: { isEnabled: true, limit: true },
	})

	return configured ?? capabilityCatalog[capability].defaults[plan]
}

export async function canUse(
	userId: string,
	capability: Capability,
	client?: CapabilityClient,
): Promise<boolean> {
	return (await resolveCapability(userId, capability, client)).isEnabled
}

export async function getLimit(
	userId: string,
	capability: Capability,
	client?: CapabilityClient,
): Promise<number | null> {
	return (await resolveCapability(userId, capability, client)).limit
}

export async function checkLimit(
	userId: string,
	capability: Extract<Capability, "accounts.active" | "events.create.monthly">,
	quantity = 1,
	client: CapabilityClient = prisma,
): Promise<{ allowed: boolean; used: number; limit: number | null }> {
	const configuration = await resolveCapability(userId, capability, client)
	if (!configuration.isEnabled) {
		return { allowed: false, used: 0, limit: configuration.limit }
	}
	if (configuration.limit === null) {
		return { allowed: true, used: 0, limit: null }
	}

	const now = new Date()
	const used =
		capability === "accounts.active"
			? await client.account.count({
					where: { userId, isActive: true, type: { not: "INVESTMENT" } },
				})
			: await client.event.count({
					where: {
						userId,
						createdAt: {
							gte: new Date(now.getFullYear(), now.getMonth(), 1),
							lt: new Date(now.getFullYear(), now.getMonth() + 1, 1),
						},
					},
				})

	return {
		allowed: used + quantity <= configuration.limit,
		used,
		limit: configuration.limit,
	}
}

export async function withLimit<T>(
	userId: string,
	capability: Extract<Capability, "accounts.active" | "events.create.monthly">,
	quantity: number,
	work: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<{ allowed: true; value: T } | { allowed: false }> {
	return prisma.$transaction(
		async (tx) => {
			const limit = await checkLimit(userId, capability, quantity, tx)
			if (!limit.allowed) return { allowed: false }
			return { allowed: true, value: await work(tx) }
		},
		{ isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
	)
}

export async function canManageInvestmentResource(
	userId: string,
	accountTypes: AccountType[],
	eventType?: EventType,
): Promise<boolean> {
	if (eventType !== "INVESTMENT" && !accountTypes.includes("INVESTMENT")) {
		return true
	}

	return canUse(userId, "investments.manage")
}
