import { getEventIconKey, type EventIconKey } from "@/lib/event-icon-rules"
import type { Cents } from "@/types/finance"

export interface SpendingByCategoryInput {
	description: string
	amount: Cents
	categoryName: string | null
}

export interface SpendingCategoryItem {
	name: string
	amount: Cents
}

export interface SpendingIconGroup {
	iconKey: EventIconKey
	total: Cents
	categories: SpendingCategoryItem[]
}

export function buildSpendingByCategoryReport(
	events: SpendingByCategoryInput[],
): SpendingIconGroup[] {
	const groups = new Map<
		EventIconKey,
		{ total: Cents; categories: Map<string, Cents> }
	>()

	for (const event of events) {
		if (event.amount >= 0) continue

		const iconKey = getEventIconKey(event.description)
		const group = groups.get(iconKey) ?? {
			total: 0,
			categories: new Map<string, Cents>(),
		}
		const categoryName = event.categoryName ?? "Sem categoria"
		const amount = Math.abs(event.amount)

		group.total += amount
		group.categories.set(
			categoryName,
			(group.categories.get(categoryName) ?? 0) + amount,
		)
		groups.set(iconKey, group)
	}

	return Array.from(groups, ([iconKey, group]) => ({
		iconKey,
		total: group.total,
		categories: Array.from(group.categories, ([name, amount]) => ({
			name,
			amount,
		})).sort((a, b) => b.amount - a.amount),
	})).sort((a, b) => b.total - a.total)
}
