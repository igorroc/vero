import type { Cents } from "@/types/finance"

export type ExpenseCostType = "RECURRENT" | "EXCEPTIONAL" | null

export interface ExpenseRecord {
	categoryId: string | null
	categoryName: string | null
	description: string
	/** Magnitude do gasto (sempre positivo). */
	amountCents: Cents
	/** YYYY-MM-DD */
	date: string
	status: "PLANNED" | "CONFIRMED" | "SKIPPED"
	costType?: ExpenseCostType
}

export interface BudgetItemRecord {
	categoryId: string
	categoryName: string
	amountCents: Cents
}

export interface MissingExpensesInput {
	/** YYYY-MM do mês analisado. */
	periodMonth: string
	/** YYYY-MM-DD de hoje (para o flag de vencido). */
	today: string
	lookbackMonths: number
	/** Quantos meses do histórico bastam para considerar recorrente. */
	minOccurrences: number
	/** Gastos dos meses anteriores ({EXPENSE}, sem templates). */
	history: ExpenseRecord[]
	/** Gastos do mês atual, incluindo ocorrências projetadas. */
	current: ExpenseRecord[]
	/** Itens orçados para o mês atual. */
	budget: BudgetItemRecord[]
}

export interface MissingExpenseItem {
	key: string
	categoryName: string
	description: string
	expectedAmountCents: Cents
	expectedDay: number | null
	monthsPresent: number
	/** YYYY-MM do último mês em que apareceu. */
	lastMonth: string | null
	source: "recorrente" | "orcamento"
	/** O dia esperado já passou (comparado com `today`). */
	overdue: boolean
}

function normalize(value: string): string {
	return value
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
		.trim()
}

function keyOf(record: {
	categoryId: string | null
	categoryName: string | null
	description: string
}): string {
	return (
		record.categoryId ??
		`d:${normalize(record.categoryName ?? record.description)}`
	)
}

function median(values: number[]): number {
	if (values.length === 0) return 0
	const sorted = [...values].sort((a, b) => a - b)
	const middle = Math.floor(sorted.length / 2)
	return sorted.length % 2 === 0
		? Math.round((sorted[middle - 1] + sorted[middle]) / 2)
		: sorted[middle]
}

function monthKeyOffset(monthKey: string, offset: number): string {
	const [year, month] = monthKey.split("-").map(Number)
	const date = new Date(Date.UTC(year, month - 1 + offset, 1))
	return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`
}

/**
 * Detecta gastos esperados que ainda NÃO foram registrados no mês atual,
 * combinando três sinais: repetição no histórico, marcação de custo recorrente
 * e itens do orçamento do mês. Módulo puro.
 */
export function findMissingExpenses(
	input: MissingExpensesInput,
): MissingExpenseItem[] {
	const currentPresent = new Set<string>()
	const currentSkipped = new Set<string>()
	for (const record of input.current) {
		const key = keyOf(record)
		if (record.status === "SKIPPED") currentSkipped.add(key)
		else currentPresent.add(key)
	}

	type Group = {
		name: string
		description: string
		months: Set<string>
		days: number[]
		amounts: number[]
		lastMonth: string
		recurrent: boolean
	}
	const groups = new Map<string, Group>()
	const currentMonth = input.periodMonth
	const windowStart = monthKeyOffset(currentMonth, -input.lookbackMonths)

	for (const record of input.history) {
		if (record.status === "SKIPPED") continue
		const key = keyOf(record)
		const month = record.date.slice(0, 7)
		if (month >= currentMonth || month < windowStart) continue
		const day = Number(record.date.slice(8, 10))
		const group = groups.get(key) ?? {
			name: record.categoryName ?? record.description,
			description: record.description,
			months: new Set<string>(),
			days: [],
			amounts: [],
			lastMonth: month,
			recurrent: false,
		}
		group.months.add(month)
		if (Number.isFinite(day)) group.days.push(day)
		group.amounts.push(Math.abs(record.amountCents))
		if (record.costType === "RECURRENT") group.recurrent = true
		if (month > group.lastMonth) {
			group.lastMonth = month
			group.description = record.description
			if (record.categoryName) group.name = record.categoryName
		}
		groups.set(key, group)
	}

	const todayMonth = input.today.slice(0, 7)
	const todayDay = Number(input.today.slice(8, 10))
	const isOverdue = (expectedDay: number | null): boolean => {
		if (expectedDay == null) return false
		if (currentMonth < todayMonth) return true
		if (currentMonth > todayMonth) return false
		return expectedDay <= todayDay
	}
	const items: MissingExpenseItem[] = []
	const covered = new Set<string>()

	for (const [key, group] of groups) {
		if (currentPresent.has(key) || currentSkipped.has(key)) continue
		if (group.months.size < input.minOccurrences && !group.recurrent) continue
		const expectedDay = group.days.length > 0 ? median(group.days) : null
		items.push({
			key,
			categoryName: group.name,
			description: group.description,
			expectedAmountCents: median(group.amounts),
			expectedDay,
			monthsPresent: group.months.size,
			lastMonth: group.lastMonth,
			source: "recorrente",
			overdue: isOverdue(expectedDay),
		})
		covered.add(key)
	}

	for (const item of input.budget) {
		const key = item.categoryId
		if (currentPresent.has(key) || currentSkipped.has(key) || covered.has(key))
			continue
		if (currentSkipped.has(`d:${normalize(item.categoryName)}`)) continue
		items.push({
			key,
			categoryName: item.categoryName,
			description: item.categoryName,
			expectedAmountCents: item.amountCents,
			expectedDay: null,
			monthsPresent: 0,
			lastMonth: null,
			source: "orcamento",
			overdue: false,
		})
		covered.add(key)
	}

	return items.sort((a, b) => {
		if (a.overdue !== b.overdue) return a.overdue ? -1 : 1
		return b.expectedAmountCents - a.expectedAmountCents
	})
}
