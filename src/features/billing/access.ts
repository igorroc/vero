export type AccessPlan = "FREE" | "PLUS"

export type ActiveEntitlement = {

	id: string
	plan: AccessPlan
	source: string
	startsAt: Date
	endsAt: Date | null
}

const planPriority: Record<AccessPlan, number> = {
	FREE: 0,
	PLUS: 1,
}

export function resolveAccessPlan(
	entitlements: ActiveEntitlement[],
	now = new Date(),
): AccessPlan {
	const activeEntitlements = entitlements.filter(
		(entitlement) =>
			entitlement.startsAt <= now &&
			(entitlement.endsAt === null || entitlement.endsAt > now),
	)

	return activeEntitlements.reduce<AccessPlan>((bestPlan, entitlement) => {
		if (planPriority[entitlement.plan] > planPriority[bestPlan]) {
			return entitlement.plan
		}

		return bestPlan
	}, "FREE")
}

export function hasPlusAccess(
	entitlements: ActiveEntitlement[],
	now = new Date(),
): boolean {
	return resolveAccessPlan(entitlements, now) === "PLUS"
}
