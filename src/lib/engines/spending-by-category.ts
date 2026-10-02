import { getEventIconKey, type EventIconKey } from "@/lib/event-icon-rules"
import type { Cents } from "@/types/finance"

export interface SpendingByCategoryInput {
	description: string
	amount: Cents
	categoryName: string | null
	categoryGroupId?: string | null
}

export interface SpendingCategoryItem {
	name: string
	amount: Cents
	/** Quantidade de lançamentos que compõem o total. */
	count: number
}

export interface SpendingIconGroup {
	iconKey: EventIconKey
	total: Cents
	/** Quantidade de lançamentos que compõem o grupo. */
	count: number
	categories: SpendingCategoryItem[]
}

export function buildSpendingByCategoryReport(
	events: SpendingByCategoryInput[],
): SpendingIconGroup[] {
	const groups = new Map<
		EventIconKey,
		{
			total: Cents
			count: number
			categories: Map<string, { amount: Cents; count: number }>
		}
	>()

	for (const event of events) {
		if (event.amount >= 0) continue

		const iconKey = getEventIconKey(event.description, event.categoryGroupId)
		const group = groups.get(iconKey) ?? {
			total: 0,
			count: 0,
			categories: new Map<string, { amount: Cents; count: number }>(),
		}
		const categoryName = event.categoryName ?? "Sem categoria"
		const amount = Math.abs(event.amount)
		const category = group.categories.get(categoryName) ?? {
			amount: 0,
			count: 0,
		}

		category.amount += amount
		category.count += 1
		group.categories.set(categoryName, category)
		group.total += amount
		group.count += 1
		groups.set(iconKey, group)
	}

	return Array.from(groups, ([iconKey, group]) => ({
		iconKey,
		total: group.total,
		count: group.count,
		categories: Array.from(group.categories, ([name, data]) => ({
			name,
			amount: data.amount,
			count: data.count,
		})).sort((a, b) => b.amount - a.amount),
	})).sort((a, b) => b.total - a.total)
}
