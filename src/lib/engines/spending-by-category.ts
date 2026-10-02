import { getEventIconKey, type EventIconKey } from "@/lib/event-icon-rules"
import type { Cents } from "@/types/finance"

export type SpendingGroupType =
	| "INCOME"
	| "ESSENTIAL"
	| "LIFESTYLE"
	| "INVESTMENT"

export interface SpendingByCategoryInput {
	categoryId: string | null
	categoryName: string | null
	categoryGroupId: string | null
	categoryGroupName: string | null
	categoryGroupType: SpendingGroupType | null
	amount: Cents
}

export interface SpendingCategoryItem {
	categoryId: string | null
	name: string
	amount: Cents
	/** Quantidade de lançamentos que compõem o total. */
	count: number
}

export interface SpendingGroupSummary {
	/** Chave estável do grupo: id do grupo de categoria. */
	key: string
	/** Nome do grupo de categoria definido pela pessoa usuária. */
	name: string
	type: SpendingGroupType | null
	/** Ícone derivado do nome do grupo (visual). */
	iconKey: EventIconKey
	total: Cents
	/** Quantidade de lançamentos que compõem o grupo. */
	count: number
	categories: SpendingCategoryItem[]
}

const UNCATEGORIZED_KEY = "uncategorized"
const UNCATEGORIZED_NAME = "Sem grupo"

/**
 * Agrupa os gastos confirmados pelo GRUPO DE CATEGORIA (definido pela pessoa
 * usuária), mantendo as categorias dentro de cada grupo. Segue o mesmo padrão
 * do relatório de orçamento e evita o agrupamento por palavras-chave da
 * descrição. O ícone é apenas visual, derivado do nome do grupo.
 */
export function buildSpendingByCategoryReport(
	events: SpendingByCategoryInput[],
): SpendingGroupSummary[] {
	const groups = new Map<
		string,
		{
			name: string
			type: SpendingGroupType | null
			total: Cents
			count: number
			categories: Map<string, SpendingCategoryItem>
		}
	>()

	for (const event of events) {
		if (event.amount >= 0) continue

		const key = event.categoryGroupId ?? UNCATEGORIZED_KEY
		const group = groups.get(key) ?? {
			name: event.categoryGroupName ?? UNCATEGORIZED_NAME,
			type: event.categoryGroupType,
			total: 0,
			count: 0,
			categories: new Map<string, SpendingCategoryItem>(),
		}
		const categoryKey =
			event.categoryId ?? event.categoryName ?? UNCATEGORIZED_KEY
		const category = group.categories.get(categoryKey) ?? {
			categoryId: event.categoryId,
			name: event.categoryName ?? "Sem categoria",
			amount: 0,
			count: 0,
		}
		const amount = Math.abs(event.amount)

		category.amount += amount
		category.count += 1
		group.categories.set(categoryKey, category)
		group.total += amount
		group.count += 1
		groups.set(key, group)
	}

	return Array.from(groups, ([key, group]) => ({
		key,
		name: group.name,
		type: group.type,
		iconKey: getEventIconKey(group.name),
		total: group.total,
		count: group.count,
		categories: Array.from(group.categories.values()).sort(
			(a, b) => b.amount - a.amount,
		),
	})).sort((a, b) => b.total - a.total)
}
