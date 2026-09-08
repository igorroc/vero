"use client"

import type { ReactNode } from "react"
import { ArrowDownRight, ArrowUpRight, ChevronDown, Minus } from "lucide-react"
import type { BudgetGroupType, BudgetReport } from "@/lib/engines/budget-report"
import { formatCurrency } from "@/types/finance"

const typeLabels: Record<BudgetGroupType, string> = {
	INCOME: "Entradas",
	ESSENTIAL: "Essencial",
	LIFESTYLE: "Estilo de vida",
	INVESTMENT: "Investimentos",
}

interface BudgetReportTypeCardProps {
	type: BudgetGroupType
	groups: BudgetReport["groups"]
	allocation:
		BudgetReport["allocation"][Exclude<BudgetGroupType, "INCOME">] | null
	isExpanded: boolean
	onToggle: () => void
	renderGroup: (group: BudgetReport["groups"][number]) => ReactNode
}

export function BudgetReportTypeCard({
	type,
	groups,
	allocation,
	isExpanded,
	onToggle,
	renderGroup,
}: BudgetReportTypeCardProps) {
	const budgeted = groups.reduce((total, group) => total + group.budgeted, 0)
	const actual = groups.reduce((total, group) => total + group.actual, 0)

	return (
		<section className="modern-card overflow-hidden">
			<button
				type="button"
				className="grid w-full grid-cols-[1fr_auto] items-center gap-3 p-4 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
				aria-expanded={isExpanded}
				onClick={onToggle}
			>
				<div>
					<p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
						Tipo de planejamento
					</p>
					<h2 className="font-semibold">{typeLabels[type]}</h2>
					{allocation ? (
						<AllocationSummary
							target={allocation.target}
							budgeted={allocation.budgeted}
							actual={allocation.actual}
						/>
					) : (
						<p className="text-xs text-slate-500">
							{groups.length} grupo{groups.length !== 1 ? "s" : ""}
						</p>
					)}
				</div>
				<div className="flex items-center gap-4">
					<div className="hidden text-right text-xs sm:block">
						<p className="text-slate-500">Orçado</p>
						<p className="font-medium">{formatCurrency(budgeted)}</p>
					</div>
					<div className="hidden text-right text-xs sm:block">
						<p className="text-slate-500">Realizado</p>
						<p className="font-medium">{formatCurrency(actual)}</p>
					</div>
					<DifferenceIndicator type={type} difference={budgeted - actual} />
					<ChevronDown
						className={`h-4 w-4 text-slate-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
					/>
				</div>
			</button>
			{isExpanded && (
				<div className="space-y-2 border-t bg-slate-50/70 p-2 dark:bg-slate-800/30 sm:p-3">
					{groups.map(renderGroup)}
				</div>
			)}
		</section>
	)
}

function AllocationSummary({
	target,
	budgeted,
	actual,
}: {
	target: number
	budgeted: number
	actual: number
}) {
	return (
		<div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs">
			<span className="text-slate-500">Meta: até {target}% das entradas</span>
			<span
				className={
					budgeted > target ? "font-medium text-red-600" : "text-slate-600"
				}
			>
				Orçado: {budgeted.toFixed(1)}%
			</span>
			<span
				className={
					actual > target ? "font-medium text-red-600" : "text-slate-600"
				}
			>
				Realizado: {actual.toFixed(1)}%
			</span>
		</div>
	)
}

function DifferenceIndicator({
	type,
	difference,
}: {
	type: BudgetGroupType
	difference: number
}) {
	const isNeutral = difference === 0
	const isFavorable = type === "INCOME" ? difference < 0 : difference > 0
	const Icon = isNeutral
		? Minus
		: type === "INCOME"
			? isFavorable
				? ArrowUpRight
				: ArrowDownRight
			: isFavorable
				? ArrowDownRight
				: ArrowUpRight
	const color = isNeutral
		? "text-slate-500"
		: isFavorable
			? "text-emerald-600"
			: "text-red-600"
	return (
		<span className={`inline-flex items-center gap-1 font-medium ${color}`}>
			<Icon className="h-4 w-4" aria-hidden />
			{formatCurrency(difference)}
		</span>
	)
}
