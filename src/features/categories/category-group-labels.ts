import type { CategoryGroupType } from "@prisma/client"

export type CategoryGroupTypeLabel = Record<CategoryGroupType, string>

export const categoryGroupTypeLabels: CategoryGroupTypeLabel = {
	INCOME: "Receitas",
	ESSENTIAL: "Essencial",
	LIFESTYLE: "Estilo de vida",
	INVESTMENT: "Investimentos",
}
