"use client"

import { useEffect, useState } from "react"
import { Input, Spinner } from "@nextui-org/react"
import { ArrowDownRight, ArrowUpRight, ChevronDown, Minus } from "lucide-react"
import { getBudgetReport } from "@/features/budgets"
import type { BudgetGroupType, BudgetReport } from "@/lib/engines/budget-report"
import { formatCurrency } from "@/types/finance"
import { toast } from "react-toastify"

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
			{!report ? (
				<div className="modern-card p-8 text-center text-slate-500">
					Nenhum orçamento criado para este mês.
				</div>
			) : (
				<>
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
					{reportTypes.map((type) => {
						const groups = report.groups.filter((group) => group.type === type)
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
										<h2 className="font-semibold">{typeLabels[type]}</h2>
										<p className="text-xs text-slate-500">
											{groups.length} grupo{groups.length !== 1 ? "s" : ""}
										</p>
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
									<div className="border-t">
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
				</>
			)}
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
		<div className="border-b last:border-0">
			<button
				type="button"
				className="grid w-full grid-cols-[1fr_auto] items-center gap-3 p-4 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
				aria-expanded={isExpanded}
				onClick={onToggle}
			>
				<div>
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
				<div>
					<div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 border-y p-3 text-xs text-slate-500">
						<span>Categoria</span>
						<span>Orçado</span>
						<span>Realizado</span>
						<span>Diferença</span>
					</div>
					{group.items.map((item) => (
						<div
							key={item.categoryId}
							className="grid grid-cols-[1fr_auto_auto_auto] gap-3 border-b p-3 text-sm last:border-0"
						>
							<span>
								{item.categoryName}
								<small className="ml-2 text-slate-400">
									{item.executionPercent.toFixed(0)}%
								</small>
							</span>
							<span>{formatCurrency(item.budgeted)}</span>
							<span>{formatCurrency(item.actual)}</span>
							<DifferenceIndicator
								type={group.type}
								difference={item.difference}
							/>
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
