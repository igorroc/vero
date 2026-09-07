"use client"

import { useEffect, useState } from "react"
import { Input, Spinner } from "@nextui-org/react"
import { ArrowDownRight, ArrowUpRight, ChevronDown, Minus } from "lucide-react"
import { getBudgetReport } from "@/features/budgets"
import type { BudgetGroupType, BudgetReport } from "@/lib/engines/budget-report"
import { formatCurrency } from "@/types/finance"
import { toast } from "react-toastify"
import { BudgetPlanWarning } from "./budget-plan-warning"

const reportTypes = ["INCOME", "ESSENTIAL", "LIFESTYLE", "INVESTMENT"] as const

const typeLabels: Record<BudgetGroupType, string> = {
	INCOME: "Entradas",
	ESSENTIAL: "Essencial",
	LIFESTYLE: "Estilo de vida",
	INVESTMENT: "Investimentos",
}

export function BudgetReportContent() {
	const now = new Date()
	const [year, setYear] = useState(now.getFullYear())
	const [month, setMonth] = useState(now.getMonth() + 1)
	const [report, setReport] = useState<BudgetReport | null>(null)
	const [loading, setLoading] = useState(true)
	const [expandedTypes, setExpandedTypes] = useState<Set<BudgetGroupType>>(
		new Set(),
	)
	const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
	useEffect(() => {
		setLoading(true)
		getBudgetReport(year, month).then((result) => {
			if (result.success) setReport(result.report)
			else toast.error(result.error)
			setLoading(false)
		})
	}, [year, month])
	if (loading)
		return (
			<div className="flex min-h-64 items-center justify-center">
				<Spinner label="Carregando relatório..." />
			</div>
		)
	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
				<div>
					<p className="text-sm font-medium text-primary">
						Planejamento mensal
					</p>
					<h1 className="text-2xl font-bold text-slate-900 dark:text-white">
						Relatório de orçamento
					</h1>
					<p className="text-sm text-slate-500">
						Acompanhe o plano, o realizado e os limites por tipo de gasto.
					</p>
				</div>
				<Input
					type="month"
					label="Mês do relatório"
					value={`${year}-${String(month).padStart(2, "0")}`}
					onValueChange={(value) => {
						const [nextYear, nextMonth] = value.split("-").map(Number)
						setYear(nextYear)
						setMonth(nextMonth)
					}}
					className="max-w-xs"
				/>
			</div>
			{!report ? (
				<div className="modern-card p-8 text-center text-slate-500">
					Nenhum orçamento criado para este mês.
				</div>
			) : (
				<>
					<section aria-labelledby="overview-heading">
						<h2
							id="overview-heading"
							className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200"
						>
							Visão geral
						</h2>
						<div className="grid gap-4 md:grid-cols-2">
							<Summary
								title="Receitas"
								type="INCOME"
								budgeted={report.income.budgeted}
								actual={report.income.actual}
							/>
							<Summary
								title="Saídas"
								type="ESSENTIAL"
								budgeted={report.outgoing.budgeted}
								actual={report.outgoing.actual}
							/>
						</div>
					</section>
					{report.planAdjustment && (
						<BudgetPlanWarning adjustment={report.planAdjustment} />
					)}
					<section aria-labelledby="types-heading" className="space-y-3">
						<div>
							<h2
								id="types-heading"
								className="text-sm font-semibold text-slate-700 dark:text-slate-200"
							>
								Detalhamento por tipo
							</h2>
							<p className="text-sm text-slate-500">
								Abra um tipo para ver os grupos e, em seguida, suas categorias.
							</p>
						</div>
						{reportTypes.map((type) => {
							const groups = report.groups.filter(
								(group) => group.type === type,
							)
							if (groups.length === 0) return null
							const budgeted = groups.reduce(
								(total, group) => total + group.budgeted,
								0,
							)
							const actual = groups.reduce(
								(total, group) => total + group.actual,
								0,
							)
							const isExpanded = expandedTypes.has(type)
							const allocation =
								type === "INCOME" ? null : report.allocation[type]

							return (
								<section key={type} className="modern-card overflow-hidden">
									<button
										type="button"
										className="grid w-full grid-cols-[1fr_auto] items-center gap-3 p-4 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
										aria-expanded={isExpanded}
										onClick={() =>
											setExpandedTypes((current) => {
												const next = new Set(current)
												if (next.has(type)) next.delete(type)
												else next.add(type)
												return next
											})
										}
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
												<p className="font-medium">
													{formatCurrency(budgeted)}
												</p>
											</div>
											<div className="hidden text-right text-xs sm:block">
												<p className="text-slate-500">Realizado</p>
												<p className="font-medium">{formatCurrency(actual)}</p>
											</div>
											<DifferenceIndicator
												type={type}
												difference={budgeted - actual}
											/>
											<ChevronDown
												className={`h-4 w-4 text-slate-400 transition-transform ${
													isExpanded ? "rotate-180" : ""
												}`}
											/>
										</div>
									</button>
									{isExpanded && (
										<div className="space-y-2 border-t bg-slate-50/70 p-2 dark:bg-slate-800/30 sm:p-3">
											{groups.map((group) => (
												<CategoryGroup
													key={`${group.type}-${group.name}`}
													group={group}
													isExpanded={expandedGroups.has(
														`${group.type}-${group.name}`,
													)}
													onToggle={() =>
														setExpandedGroups((current) => {
															const groupKey = `${group.type}-${group.name}`
															const next = new Set(current)
															if (next.has(groupKey)) next.delete(groupKey)
															else next.add(groupKey)
															return next
														})
													}
												/>
											))}
										</div>
									)}
								</section>
							)
						})}
					</section>
				</>
			)}
		</div>
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
	const budgetedAboveTarget = budgeted > target
	const actualAboveTarget = actual > target

	return (
		<div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs">
			<span className="text-slate-500">Meta: até {target}% das entradas</span>
			<span
				className={
					budgetedAboveTarget ? "font-medium text-red-600" : "text-slate-600"
				}
			>
				Orçado: {budgeted.toFixed(1)}%
			</span>
			<span
				className={
					actualAboveTarget ? "font-medium text-red-600" : "text-slate-600"
				}
			>
				Realizado: {actual.toFixed(1)}%
			</span>
		</div>
	)
}

function CategoryGroup({
	group,
	isExpanded,
	onToggle,
}: {
	group: BudgetReport["groups"][number]
	isExpanded: boolean
	onToggle: () => void
}) {
	const difference = group.budgeted - group.actual

	return (
		<div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
			<button
				type="button"
				className="grid w-full grid-cols-[1fr_auto] items-center gap-3 p-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 sm:p-4"
				aria-expanded={isExpanded}
				onClick={onToggle}
			>
				<div>
					<p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
						Grupo de categorias
					</p>
					<h3 className="font-medium">{group.name}</h3>
					<p className="text-xs text-slate-500">
						{group.items.length} categoria{group.items.length !== 1 ? "s" : ""}
					</p>
				</div>
				<div className="flex items-center gap-4">
					<div className="hidden text-right text-xs sm:block">
						<p className="text-slate-500">Orçado</p>
						<p className="font-medium">{formatCurrency(group.budgeted)}</p>
					</div>
					<div className="hidden text-right text-xs sm:block">
						<p className="text-slate-500">Realizado</p>
						<p className="font-medium">{formatCurrency(group.actual)}</p>
					</div>
					<DifferenceIndicator type={group.type} difference={difference} />
					<ChevronDown
						className={`h-4 w-4 text-slate-400 transition-transform ${
							isExpanded ? "rotate-180" : ""
						}`}
					/>
				</div>
			</button>
			{isExpanded && (
				<div className="border-t bg-slate-50/70 p-2 dark:bg-slate-800/30 sm:p-3">
					<div className="hidden grid-cols-[minmax(0,1fr)_auto_auto_auto] gap-3 px-3 pb-2 text-[11px] font-medium uppercase tracking-wide text-slate-400 sm:grid">
						<span>Categoria</span>
						<span>Orçado</span>
						<span>Realizado</span>
						<span>Diferença</span>
					</div>
					{group.items.map((item) => (
						<div
							key={item.categoryId}
							className="grid grid-cols-2 gap-x-3 gap-y-2 rounded-lg bg-white p-3 text-sm shadow-sm dark:bg-slate-900 sm:grid-cols-[minmax(0,1fr)_auto_auto_auto] sm:items-center"
						>
							<div className="col-span-2 min-w-0 border-l-2 border-slate-200 pl-3 dark:border-slate-700 sm:col-span-1">
								<p className="truncate font-medium">{item.categoryName}</p>
								<p className="text-xs text-slate-500">
									Execução: {item.executionPercent.toFixed(0)}%
								</p>
							</div>
							<div className="sm:contents">
								<span className="flex flex-col gap-0.5 sm:block">
									<span className="text-[11px] font-medium uppercase tracking-wide text-slate-400 sm:hidden">
										Orçado
									</span>
									{formatCurrency(item.budgeted)}
								</span>
								<span className="flex flex-col gap-0.5 sm:block">
									<span className="text-[11px] font-medium uppercase tracking-wide text-slate-400 sm:hidden">
										Realizado
									</span>
									{formatCurrency(item.actual)}
								</span>
								<div className="col-span-2 flex flex-col gap-0.5 sm:col-span-1 sm:block">
									<span className="text-[11px] font-medium uppercase tracking-wide text-slate-400 sm:hidden">
										Diferença
									</span>
									<DifferenceIndicator
										type={group.type}
										difference={item.difference}
									/>
								</div>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	)
}

function Summary({
	title,
	type,
	budgeted,
	actual,
}: {
	title: string
	type: BudgetGroupType
	budgeted: number
	actual: number
}) {
	const difference = budgeted - actual
	return (
		<div className="modern-card p-4">
			<p className="text-sm text-slate-500">{title}</p>
			<p className="mt-2 text-lg font-semibold">
				Orçado: {formatCurrency(budgeted)}
			</p>
			<p className="text-sm">Realizado: {formatCurrency(actual)}</p>
			<div className="mt-2">
				<DifferenceIndicator type={type} difference={difference} showLabel />
			</div>
		</div>
	)
}

function DifferenceIndicator({
	type,
	difference,
	showLabel = false,
}: {
	type: BudgetGroupType
	difference: number
	showLabel?: boolean
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
	const label = isNeutral
		? "Dentro do previsto"
		: type === "INCOME"
			? isFavorable
				? "Receita acima do previsto"
				: "Receita abaixo do previsto"
			: isFavorable
				? "Abaixo do orçamento"
				: "Acima do orçamento"

	return (
		<span
			className={`inline-flex items-center gap-1 font-medium ${color}`}
			title={label}
		>
			<Icon className="h-4 w-4" aria-hidden />
			{formatCurrency(difference)}
			{showLabel && <span className="text-xs">{label}</span>}
		</span>
	)
}
