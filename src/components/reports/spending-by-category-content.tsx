"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Button, Input, Spinner } from "@nextui-org/react"
import {
	Pie,
	PieChart,
	ResponsiveContainer,
	Sector,
	Tooltip,
	type PieSectorShapeProps,
} from "recharts"
import {
	ArrowDownRight,
	ArrowUpRight,
	BadgePercent,
	Banknote,
	Building2,
	Car,
	CreditCard,
	Heart,
	HandCoins,
	Home,
	Landmark,
	Minus,
	Music,
	Phone,
	ReceiptText,
	Scissors,
	ShoppingCart,
	Utensils,
	Zap,
	type LucideIcon,
} from "lucide-react"
import { getSpendingByCategory } from "@/features/reports"
import { eventIconDefinitions, type EventIconKey } from "@/lib/event-icon-rules"
import {
	buildSpendingComparison,
	calculateChangePercent,
	getPreviousMonth,
	type SpendingComparisonGroup,
} from "@/lib/engines/spending-comparison"
import { formatCurrency } from "@/types/finance"

const eventIcons: Record<EventIconKey, LucideIcon> = {
	property: Building2,
	beauty: Scissors,
	income: Banknote,
	adjustment: BadgePercent,
	card: ReceiptText,
	debt: HandCoins,
	tax: Landmark,
	phone: Phone,
	education: Music,
	donation: Heart,
	transport: Car,
	housing: Home,
	shopping: ShoppingCart,
	food: Utensils,
	health: Heart,
	utilities: Zap,
	other: CreditCard,
}

interface SpendingChartSlice {
	name: string
	value: number
	color: string
}

function formatMonthLabel(year: number, month: number): string {
	return new Intl.DateTimeFormat("pt-BR", {
		month: "long",
		year: "numeric",
		timeZone: "UTC",
	}).format(new Date(Date.UTC(year, month - 1, 1)))
}

function SpendingPieSlice(props: PieSectorShapeProps) {
	const slice = props as PieSectorShapeProps & { color?: unknown }
	const fill = typeof slice.color === "string" ? slice.color : props.fill

	return <Sector {...props} fill={fill} />
}

/**
 * Variação de gasto vs. mês anterior. Aumento é ruim (vermelho) e redução é
 * boa (verde); `null` significa categoria nova (não havia gasto antes).
 */
function ChangeBadge({ changePercent }: { changePercent: number | null }) {
	if (changePercent === null) {
		return (
			<span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
				<ArrowUpRight size={12} />
				novo
			</span>
		)
	}
	const rounded = Math.round(changePercent)
	if (rounded === 0) {
		return (
			<span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium text-slate-400">
				<Minus size={12} />
				0%
			</span>
		)
	}
	const increasing = rounded > 0
	const Icon = increasing ? ArrowUpRight : ArrowDownRight
	const tone = increasing
		? "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400"
		: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
	return (
		<span
			className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${tone}`}
		>
			<Icon size={12} />
			{increasing ? "+" : "-"}
			{Math.abs(rounded)}%
		</span>
	)
}

export function SpendingByCategoryContent() {
	const now = new Date()
	const [year, setYear] = useState(now.getFullYear())
	const [month, setMonth] = useState(now.getMonth() + 1)
	const [comparison, setComparison] = useState<SpendingComparisonGroup[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		let active = true
		setLoading(true)
		setError(null)
		const previous = getPreviousMonth(year, month)
		Promise.all([
			getSpendingByCategory(year, month),
			getSpendingByCategory(previous.year, previous.month),
		]).then(([current, before]) => {
			if (!active) return
			if (!current.success) {
				setError(current.error)
				setLoading(false)
				return
			}
			const previousGroups = before.success ? before.groups : []
			setComparison(buildSpendingComparison(current.groups, previousGroups))
			setLoading(false)
		})
		return () => {
			active = false
		}
	}, [year, month])

	if (loading) {
		return (
			<div className="flex min-h-64 items-center justify-center">
				<Spinner label="Carregando gastos do mês..." />
			</div>
		)
	}

	const total = comparison.reduce((sum, group) => sum + group.currentTotal, 0)
	const previousTotal = comparison.reduce(
		(sum, group) => sum + group.previousTotal,
		0,
	)
	const overallChangePercent = calculateChangePercent(total, previousTotal)
	const monthLabel = formatMonthLabel(year, month)
	const previousPeriod = getPreviousMonth(year, month)
	const previousMonthLabel = formatMonthLabel(
		previousPeriod.year,
		previousPeriod.month,
	)
	const chartData: SpendingChartSlice[] = comparison
		.filter((group) => group.currentTotal > 0)
		.map((group) => ({
			name: group.name,
			value: group.currentTotal,
			color: eventIconDefinitions[group.iconKey].color,
		}))

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
				<div>
					<p className="text-sm font-medium text-primary">Análise mensal</p>
					<h1 className="text-2xl font-bold text-slate-900 dark:text-white">
						Gastos por categoria
					</h1>
					<p className="text-sm capitalize text-slate-500">{monthLabel}</p>
				</div>
				<div className="flex flex-col gap-3 sm:flex-row sm:items-end">
					<Input
						type="month"
						label="Mês do relatório"
						value={`${year}-${String(month).padStart(2, "0")}`}
						onValueChange={(value) => {
							const [nextYear, nextMonth] = value.split("-").map(Number)
							if (!nextYear || !nextMonth) return
							setYear(nextYear)
							setMonth(nextMonth)
						}}
						className="max-w-xs"
					/>
					<Button as={Link} href="/reports/budget" variant="bordered">
						Ver orçamento mensal
					</Button>
				</div>
			</div>

			{error ? (
				<div className="modern-card p-8 text-center text-red-600">{error}</div>
			) : total === 0 ? (
				<div className="modern-card p-8 text-center">
					<p className="font-medium text-slate-900 dark:text-white">
						Nenhum gasto confirmado neste mês.
					</p>
					<p className="mt-1 text-sm text-slate-500">
						Confirme os lançamentos para acompanhar a distribuição por
						categoria.
					</p>
				</div>
			) : (
				<>
					<section
						className="modern-card p-5 sm:p-6"
						aria-labelledby="chart-heading"
					>
						<div className="flex flex-col items-center gap-6 md:flex-row md:gap-10">
							<div
								className="relative h-56 w-full max-w-[18rem] shrink-0"
								role="img"
								aria-label="Distribuição dos gastos confirmados por tipo"
							>
								<ResponsiveContainer
									width="100%"
									height="100%"
									className="relative z-10"
								>
									<PieChart>
										<Pie
											data={chartData}
											dataKey="value"
											nameKey="name"
											innerRadius="0%"
											outerRadius="88%"
											paddingAngle={0}
											stroke="none"
											shape={SpendingPieSlice}
										/>
										<Tooltip
											content={({ active, payload }) => {
												if (!active || !payload?.length) return null
												const slice = payload[0]?.payload as
													| SpendingChartSlice
													| undefined
												if (!slice) return null
												return (
													<div className="rounded-xl border border-border bg-surface px-3 py-2 text-sm shadow-surface">
														<p className="font-medium text-text-primary">
															{slice.name}
														</p>
														<p className="financial-number text-text-secondary">
															{formatCurrency(slice.value)} (
															{((slice.value / total) * 100).toFixed(1)}%)
														</p>
													</div>
												)
											}}
										/>
									</PieChart>
								</ResponsiveContainer>
							</div>
							<div className="w-full">
								<p className="text-sm text-slate-500">Total gasto no mês</p>
								<h2
									id="chart-heading"
									className="mt-1 text-3xl font-bold text-slate-900 dark:text-white"
								>
									{formatCurrency(total)}
								</h2>
								{previousTotal > 0 && (
									<p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-500">
										vs. <span className="capitalize">{previousMonthLabel}</span>
										<ChangeBadge changePercent={overallChangePercent} />
									</p>
								)}
								<p className="mt-2 text-sm text-slate-500">
									Cada fatia representa um grupo de categorias que você definiu.
								</p>
							</div>
						</div>
					</section>

					<section className="space-y-3" aria-labelledby="details-heading">
						<div>
							<h2
								id="details-heading"
								className="text-sm font-semibold text-slate-700 dark:text-slate-200"
							>
								Detalhes por categoria
							</h2>
							<p className="text-sm text-slate-500">
								Gastos do mês comparados a{" "}
								<span className="capitalize">{previousMonthLabel}</span>: a seta
								indica aumento (vermelho) ou redução (verde).
							</p>
						</div>
						<div className="grid gap-3 lg:grid-cols-2">
							{comparison.map((group) => {
								const definition = eventIconDefinitions[group.iconKey]
								const Icon = eventIcons[group.iconKey]
								const percentage =
									total > 0 ? (group.currentTotal / total) * 100 : 0

								return (
									<article
										key={group.key}
										className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
									>
										<div className="flex items-center justify-between gap-3 p-4">
											<div className="flex items-center gap-3">
												<div
													className="flex h-10 w-10 items-center justify-center rounded-xl"
													style={{
														backgroundColor: `${definition.color}20`,
														color: definition.color,
													}}
												>
													<Icon className="h-5 w-5" />
												</div>
												<div>
													<h3 className="font-semibold text-slate-900 dark:text-white">
														{group.name}
													</h3>
													<p className="text-xs text-slate-500">
														{percentage.toFixed(1)}% dos gastos
													</p>
												</div>
											</div>
											<div className="flex flex-col items-end gap-1">
												<p className="font-semibold text-slate-900 dark:text-white">
													{formatCurrency(group.currentTotal)}
												</p>
												<ChangeBadge changePercent={group.changePercent} />
											</div>
										</div>
										<div className="divide-y divide-slate-100 border-t border-slate-100 dark:divide-slate-800 dark:border-slate-800">
											{group.categories.map((category) => (
												<div
													key={category.key}
													className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm"
												>
													<div className="min-w-0 flex-1">
														<p className="truncate text-slate-600 dark:text-slate-300">
															{category.name}
														</p>
														{category.previousCents > 0 && (
															<p className="text-[11px] text-slate-400">
																antes:{" "}
																{formatCurrency(category.previousCents)}
															</p>
														)}
													</div>
													<div className="flex shrink-0 items-center gap-2">
														<span className="font-medium text-slate-900 dark:text-white">
															{formatCurrency(category.currentCents)}
														</span>
														<ChangeBadge
															changePercent={category.changePercent}
														/>
													</div>
												</div>
											))}
										</div>
									</article>
								)
							})}
						</div>
					</section>
				</>
			)}
		</div>
	)
}
