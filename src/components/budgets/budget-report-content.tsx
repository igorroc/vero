"use client"

import { useEffect, useState } from "react"
import { cn, Input, Spinner } from "@nextui-org/react"
import { ArrowDownRight, ArrowUpRight, ChevronDown, Minus } from "lucide-react"
import { getBudgetReport } from "@/features/budgets"
import { getMonthlySavings } from "@/features/reports"
import { useReportPeriod } from "@/components/reports/use-report-period"
import type { BudgetGroupType, BudgetReport } from "@/lib/engines/budget-report"
import type { MonthlySavingsResult } from "@/lib/engines/monthly-savings"
import { formatCurrency } from "@/types/finance"
import { toast } from "react-toastify"
import { BudgetPlanWarning } from "./budget-plan-warning"
import { BudgetReportTypeCard } from "./budget-report-type-card"

const reportTypes = ["INCOME", "ESSENTIAL", "LIFESTYLE", "INVESTMENT"] as const

export function BudgetReportContent() {
	const { year, month, periodParam, setPeriod } = useReportPeriod()
	const [report, setReport] = useState<BudgetReport | null>(null)
	const [savings, setSavings] = useState<MonthlySavingsResult | null>(null)
	const [loading, setLoading] = useState(true)
	const [expandedTypes, setExpandedTypes] = useState<Set<BudgetGroupType>>(
		new Set(),
	)
	const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
	useEffect(() => {
		setLoading(true)
		Promise.all([
			getBudgetReport(year, month),
			getMonthlySavings(year, month),
		]).then(([reportResult, savingsResult]) => {
			if (reportResult.success) setReport(reportResult.report)
			else toast.error(reportResult.error)
			if (savingsResult.success) setSavings(savingsResult.savings)
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
						Relatório de orçamento mensal
					</h1>
					<p className="text-sm text-slate-500">
						Acompanhe o plano, o realizado e os limites por tipo de gasto.
					</p>
				</div>
				<Input
					type="month"
					label="Mês do relatório"
					value={periodParam}
					onValueChange={(value) => {
						const [nextYear, nextMonth] = value.split("-").map(Number)
						if (!nextYear || !nextMonth) return
						setPeriod(nextYear, nextMonth)
					}}
					className="max-w-xs"
				/>
			</div>
			{savings && <SavingsSummary savings={savings} />}
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
							return (
								<BudgetReportTypeCard
									key={type}
									type={type}
									groups={groups}
									allocation={
										type === "INCOME" ? null : report.allocation[type]
									}
									isExpanded={expandedTypes.has(type)}
									onToggle={() =>
										setExpandedTypes((current) => {
											const next = new Set(current)
											if (next.has(type)) next.delete(type)
											else next.add(type)
											return next
										})
									}
									renderGroup={(group) => {
										const groupKey = `${group.type}-${group.name}`
										return (
											<CategoryGroup
												key={groupKey}
												group={group}
												isExpanded={expandedGroups.has(groupKey)}
												onToggle={() =>
													setExpandedGroups((current) => {
														const next = new Set(current)
														if (next.has(groupKey)) next.delete(groupKey)
														else next.add(groupKey)
														return next
													})
												}
											/>
										)
									}}
								/>
							)
						})}
					</section>
				</>
			)}
		</div>
	)
}

function SavingsSummary({ savings }: { savings: MonthlySavingsResult }) {
	const difference = savings.difference.saved
	return (
		<section className="modern-card p-4" aria-labelledby="savings-heading">
			<div className="mb-3">
				<h2
					id="savings-heading"
					className="text-sm font-semibold text-slate-700 dark:text-slate-200"
				>
					Economia do mês
				</h2>
				<p className="text-sm text-slate-500">
					Quanto sobra no mês: previsto versus realizado.
				</p>
			</div>
			<div className="grid gap-3 sm:grid-cols-2">
				<div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
					<p className="text-xs font-medium text-slate-600 dark:text-slate-300">
						Previsto
					</p>
					<p className="mt-1 text-lg font-semibold">
						{formatCurrency(savings.previsto.saved)}
					</p>
					<p className="text-xs text-slate-500">
						Economia total · {savings.previsto.savingsRate.toFixed(0)}% das
						entradas
					</p>
					<p className="mt-1 text-xs text-slate-500">
						Caixa livre: {formatCurrency(savings.previsto.freeCash)}
					</p>
				</div>
				<div className="rounded-xl bg-emerald-50 p-3 dark:bg-emerald-900/20">
					<p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
						Realizado
					</p>
					<p className="mt-1 text-lg font-semibold text-emerald-800 dark:text-emerald-200">
						{formatCurrency(savings.realizado.saved)}
					</p>
					<p className="text-xs text-emerald-700 dark:text-emerald-300">
						Economia total · {savings.realizado.savingsRate.toFixed(0)}% das
						entradas
					</p>
					<p className="mt-1 text-xs text-emerald-700 dark:text-emerald-300">
						Caixa livre: {formatCurrency(savings.realizado.freeCash)}
					</p>
				</div>
			</div>
			<p className="mt-3 text-sm text-slate-500">
				{difference === 0
					? "Economia exatamente como o previsto."
					: difference > 0
						? `Você está economizando ${formatCurrency(difference)} a mais que o previsto.`
						: `Você está economizando ${formatCurrency(Math.abs(difference))} a menos que o previsto.`}
			</p>
		</section>
	)
}

export function AllocationSummary({
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

export function CategoryGroup({
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
					<div className="hidden grid-cols-[minmax(0,1fr)_auto_auto_auto_auto] gap-3 px-3 pb-2 text-[11px] font-medium uppercase tracking-wide text-slate-400 sm:grid">
						<span>Categoria</span>
						<span>Orçado</span>
						<span>Realizado</span>
						<span>{group.type === "INCOME" ? "Previsto" : "Comprometido"}</span>
						<span>{group.type === "INCOME" ? "A receber" : "Disponível"}</span>
					</div>
					{group.items.map((item, index) => (
						<div
							key={item.categoryId}
							className={cn(
								"grid grid-cols-2 gap-x-3 gap-y-2 rounded-lg p-3 text-sm shadow-sm sm:grid-cols-[minmax(0,1fr)_auto_auto_auto_auto] sm:items-center",
								index % 2 === 0
									? "bg-white dark:bg-slate-900"
									: "bg-indigo-50/10 dark:bg-indigo-950/10",
							)}
						>
							<div
								className={cn(
									"col-span-2 min-w-0 border-l-2 pl-3 sm:col-span-1",
									index % 2 === 0
										? "border-slate-200 dark:border-slate-700"
										: "border-indigo-300 dark:border-indigo-700",
								)}
							>
								<p className="truncate font-medium">{item.categoryName}</p>
								<p
									className={cn(
										"text-xs text-slate-500",
										(group.type !== "INCOME" && item.executionPercent > 100) ||
											(group.type === "INCOME" && item.executionPercent < 100)
											? "text-red-600 dark:text-red-400"
											: "text-emerald-600 dark:text-emerald-400",
									)}
								>
									Execução: {item.executionPercent.toFixed(0)}%
								</p>
							</div>
							<div className="sm:contents">
								<ReportCell
									label="Orçado"
									value={formatCurrency(item.budgeted)}
								/>
								<ReportCell
									label="Realizado"
									value={formatCurrency(item.actual)}
								/>
								<ReportCell
									label={group.type === "INCOME" ? "Previsto" : "Comprometido"}
									value={formatCurrency(item.committed)}
								/>
								<ReportCell
									label={group.type === "INCOME" ? "A receber" : "Disponível"}
									value={formatCurrency(item.available)}
									tone={item.available < 0 ? "danger" : "default"}
								/>
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

export function DifferenceIndicator({
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

function ReportCell({
	label,
	value,
	tone = "default",
}: {
	label: string
	value: string
	tone?: "default" | "danger"
}) {
	return (
		<span
			className={cn(
				"flex flex-col gap-0.5 sm:block",
				tone === "danger" && "font-medium text-red-600 dark:text-red-400",
			)}
		>
			<span className="text-[11px] font-medium uppercase tracking-wide text-slate-400 sm:hidden">
				{label}
			</span>
			{value}
		</span>
	)
}
