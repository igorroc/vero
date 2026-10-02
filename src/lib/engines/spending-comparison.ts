import type { EventIconKey } from "@/lib/event-icon-rules"
import type { Cents } from "@/types/finance"
import type { SpendingGroupSummary } from "./spending-by-category"

export interface SpendingComparisonItem {
	key: string
	name: string
	currentCents: Cents
	previousCents: Cents
	differenceCents: Cents
	/** Variação percentual; `null` quando não havia gasto no mês anterior. */
	changePercent: number | null
}

export interface SpendingComparisonGroup {
	key: string
	name: string
	iconKey: EventIconKey
	currentTotal: Cents
	previousTotal: Cents
	differenceCents: Cents
	changePercent: number | null
	categories: SpendingComparisonItem[]
}

/**
 * Variação percentual entre dois meses. Quando não havia valor anterior,
 * retorna `null` (não é possível calcular percentual sobre zero).
 */
export function calculateChangePercent(
	current: Cents,
	previous: Cents,
): number | null {
	if (previous === 0) return current === 0 ? 0 : null
	return ((current - previous) / previous) * 100
}

function categoryTotals(
	group: SpendingGroupSummary | undefined,
): Map<string, { name: string; amount: Cents }> {
	const totals = new Map<string, { name: string; amount: Cents }>()
	for (const category of group?.categories ?? []) {
		const key = category.categoryId ?? category.name
		const existing = totals.get(key)
		totals.set(key, {
			name: category.name,
			amount: (existing?.amount ?? 0) + category.amount,
		})
	}
	return totals
}

function compareGroup(
	currentGroup: SpendingGroupSummary | undefined,
	previousGroup: SpendingGroupSummary | undefined,
): SpendingComparisonGroup {
	const currentByCategory = categoryTotals(currentGroup)
	const previousByCategory = categoryTotals(previousGroup)
	const keys = [
		...currentByCategory.keys(),
		...Array.from(previousByCategory.keys()).filter(
			(key) => !currentByCategory.has(key),
		),
	]
	const categories = keys
		.map((key) => {
			const currentCents = currentByCategory.get(key)?.amount ?? 0
			const previousCents = previousByCategory.get(key)?.amount ?? 0
			return {
				key,
				name:
					currentByCategory.get(key)?.name ??
					previousByCategory.get(key)?.name ??
					key,
				currentCents,
				previousCents,
				differenceCents: currentCents - previousCents,
				changePercent: calculateChangePercent(currentCents, previousCents),
			}
		})
		.sort(
			(a, b) =>
				b.currentCents - a.currentCents || b.previousCents - a.previousCents,
		)

	const reference = currentGroup ?? previousGroup
	const currentTotal = currentGroup?.total ?? 0
	const previousTotal = previousGroup?.total ?? 0
	return {
		key: reference?.key ?? "",
		name: reference?.name ?? "",
		iconKey: reference?.iconKey ?? "other",
		currentTotal,
		previousTotal,
		differenceCents: currentTotal - previousTotal,
		changePercent: calculateChangePercent(currentTotal, previousTotal),
		categories,
	}
}

/**
 * Compara os gastos por grupo/categoria entre o mês atual e o anterior (módulo
 * puro). Grupos/categorias que existem em apenas um dos meses também aparecem.
 */
export function buildSpendingComparison(
	current: SpendingGroupSummary[],
	previous: SpendingGroupSummary[],
): SpendingComparisonGroup[] {
	const previousByKey = new Map(previous.map((group) => [group.key, group]))
	const seen = new Set<string>()
	const result: SpendingComparisonGroup[] = []

	for (const group of current) {
		if (seen.has(group.key)) continue
		seen.add(group.key)
		result.push(compareGroup(group, previousByKey.get(group.key)))
	}
	for (const group of previous) {
		if (seen.has(group.key)) continue
		seen.add(group.key)
		result.push(compareGroup(undefined, group))
	}

	return result
}

/** Mês imediatamente anterior a `year`/`month`. */
export function getPreviousMonth(
	year: number,
	month: number,
): { year: number; month: number } {
	return month === 1
		? { year: year - 1, month: 12 }
		: { year, month: month - 1 }
}
