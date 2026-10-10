"use client"

import type { CategoryWithGroup } from "@/features/categories"
import { formatCurrency } from "@/types/finance"
import { BudgetCategoryRow } from "./budget-category-row"

export function amountInputToCents(value: string): number {
	const normalized = value.trim().replace(",", ".")
	if (!normalized) return 0

	const [wholePart, decimalPart = "", ...remainingParts] = normalized.split(".")
	if (
		remainingParts.length > 0 ||
		!/^\d+$/.test(wholePart) ||
		!/^\d*$/.test(decimalPart)
	)
		return 0

	const cents =
		Number(wholePart) * 100 + Number(decimalPart.padEnd(2, "0").slice(0, 2))
	return Number.isSafeInteger(cents) ? cents : 0
}

export const budgetTypes = [
	"INCOME",
	"ESSENTIAL",
	"LIFESTYLE",
	"INVESTMENT",
] as const
export type BudgetType = (typeof budgetTypes)[number]

const typeLabels: Record<BudgetType, string> = {
	INCOME: "Receitas",
	ESSENTIAL: "Essencial",
	LIFESTYLE: "Estilo de vida",
	INVESTMENT: "Investimentos",
}

const allocationTargets: Record<Exclude<BudgetType, "INCOME">, number> = {
	ESSENTIAL: 50,
	LIFESTYLE: 30,
	INVESTMENT: 20,
}

interface BudgetTypeSectionProps {
	type: BudgetType
	categories: CategoryWithGroup[]
	values: Record<string, string>
	total: number
	incomeTotal: number
	usage: Map<string, { actual: number; committed: number }>
	onValueChange: (categoryId: string, value: string) => void
}

export function BudgetTypeSection({
	type,
	categories,
	values,
	total,
	incomeTotal,
	usage,
	onValueChange,
}: BudgetTypeSectionProps) {
	return (
		<section className="modern-card overflow-hidden">
			<h2 className="border-b p-4 font-semibold">{typeLabels[type]}</h2>
			{categories.map((category) => {
				const categoryUsage = usage.get(category.id)
				const actual = categoryUsage?.actual ?? 0
				const committed = categoryUsage?.committed ?? 0
				const planned = amountInputToCents(values[category.id] ?? "")
				return (
					<BudgetCategoryRow
						key={category.id}
						category={category}
						value={values[category.id] ?? ""}
						actual={actual}
						committed={committed}
						available={planned - actual - committed}
						onValueChange={(value) => onValueChange(category.id, value)}
					/>
				)
			})}
			<BudgetTypeTotal type={type} total={total} incomeTotal={incomeTotal} />
		</section>
	)
}

interface BudgetTypeTotalProps {
	type: BudgetType
	total: number
	incomeTotal: number
}

export function BudgetTypeTotal({
	type,
	total,
	incomeTotal,
}: BudgetTypeTotalProps) {
	if (type === "INCOME") {
		return (
			<div className="flex items-center justify-between bg-slate-50 p-4 dark:bg-slate-800/50">
				<span className="text-sm font-medium">Total de receitas</span>
				<span className="font-semibold">{formatCurrency(total)}</span>
			</div>
		)
	}

	const target = allocationTargets[type]
	const percentage = incomeTotal > 0 ? (total / incomeTotal) * 100 : 0
	const targetAmount = Math.round((incomeTotal * target) / 100)
	return (
		<div className="flex flex-col gap-1 bg-slate-50 p-4 text-sm dark:bg-slate-800/50 sm:flex-row sm:items-center sm:justify-between">
			<div>
				<p className="font-medium">Total de {typeLabels[type].toLowerCase()}</p>
				<p className="text-xs text-slate-500">
					Meta ideal: até {target}% das receitas ({formatCurrency(targetAmount)}
					)
				</p>
			</div>
			<div className="text-right">
				<p className="font-semibold">{formatCurrency(total)}</p>
				<p
					className={
						percentage > target
							? "text-xs font-medium text-red-600"
							: "text-xs text-slate-500"
					}
				>
					{incomeTotal > 0
						? `${percentage.toFixed(1)}% das receitas`
						: "Cadastre receitas para comparar"}
				</p>
			</div>
		</div>
	)
}
