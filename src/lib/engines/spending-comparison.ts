import type { EventIconKey } from "@/lib/event-icon-rules"
import type { Cents } from "@/types/finance"
import type { SpendingIconGroup } from "./spending-by-category"

export interface SpendingComparisonItem {
	name: string
	currentCents: Cents
	previousCents: Cents
	differenceCents: Cents
	/** Variação percentual; `null` quando não havia gasto no mês anterior. */
	changePercent: number | null
}

export interface SpendingComparisonGroup {
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
	group: SpendingIconGroup | undefined,
): Map<string, Cents> {
	const totals = new Map<string, Cents>()
	for (const category of group?.categories ?? []) {
		totals.set(category.name, (totals.get(category.name) ?? 0) + category.amount)
	}
	return totals
}

function compareGroup(
	iconKey: EventIconKey,
	currentGroup: SpendingIconGroup | undefined,
	previousGroup: SpendingIconGroup | undefined,
): SpendingComparisonGroup {
	const currentByCategory = categoryTotals(currentGroup)
	const previousByCategory = categoryTotals(previousGroup)
	const names = [
		...currentByCategory.keys(),
		...Array.from(previousByCategory.keys()).filter(
			(name) => !currentByCategory.has(name),
		),
	]
	const categories = names
		.map((name) => {
			const currentCents = currentByCategory.get(name) ?? 0
			const previousCents = previousByCategory.get(name) ?? 0
			return {
				name,
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

	const currentTotal = currentGroup?.total ?? 0
	const previousTotal = previousGroup?.total ?? 0
	return {
		iconKey,
		currentTotal,
		previousTotal,
		differenceCents: currentTotal - previousTotal,
		changePercent: calculateChangePercent(currentTotal, previousTotal),
		categories,
	}
}

/**
 * Compara os gastos por categoria entre o mês atual e o anterior (módulo puro).
 * Grupos/categorias que existem em apenas um dos meses também aparecem.
 */
export function buildSpendingComparison(
	current: SpendingIconGroup[],
	previous: SpendingIconGroup[],
): SpendingComparisonGroup[] {
	const previousByIcon = new Map(previous.map((group) => [group.iconKey, group]))
	const seen = new Set<EventIconKey>()
	const result: SpendingComparisonGroup[] = []

	for (const group of current) {
		if (seen.has(group.iconKey)) continue
		seen.add(group.iconKey)
		result.push(
			compareGroup(group.iconKey, group, previousByIcon.get(group.iconKey)),
		)
	}
	for (const group of previous) {
		if (seen.has(group.iconKey)) continue
		seen.add(group.iconKey)
		result.push(compareGroup(group.iconKey, undefined, group))
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
