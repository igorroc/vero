import type { InvestmentPlan } from "@prisma/client"

export type InvestmentPlanWithAccount = InvestmentPlan & {
	account: { name: string; type: string }
}
