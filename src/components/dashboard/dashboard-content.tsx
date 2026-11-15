"use client"

import { Fragment, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import {
	ArrowDown,
	ArrowRight,
	ArrowUp,
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	Equal,
	Target,
} from "lucide-react"
import { getDashboardOverview } from "@/features/dashboard"
import type { BudgetReportGroup } from "@/lib/engines/budget-report"
import { formatCurrency } from "@/types/finance"
import styles from "./dashboard-overview.module.css"

function signedCurrency(value: number) {
	return `${value > 0 ? "+" : value < 0 ? "−" : ""}${formatCurrency(Math.abs(value))}`
}

function BudgetActual({
	actual,
	budgeted,
	income,
}: {
	actual: number
	budgeted: number
	income: boolean
}) {
	const percentage = budgeted > 0 ? Math.round((actual * 100) / budgeted) : null
	const exceeded = !income && actual > budgeted
	const difference = budgeted - actual
	const differenceAmount = formatCurrency(Math.abs(difference))
	const budgetMessage =
		budgeted <= 0
			? "Sem valor orçado"
			: difference === 0
				? "Dentro do previsto"
				: income
					? `${differenceAmount} ${difference > 0 ? "abaixo" : "acima"} do previsto`
					: difference > 0
						? `${differenceAmount} disponíveis`
						: `${differenceAmount} acima do orçamento`
	return (
		<div className={styles.actualCell}>
			<span>{formatCurrency(actual)}</span>
			<div
				className={styles.budgetTrack}
				role="progressbar"
				aria-label="Realizado em relação ao orçamento"
				aria-valuemin={0}
				aria-valuemax={100}
				aria-valuenow={
					percentage === null
						? undefined
						: Math.min(100, Math.max(0, percentage))
				}
				aria-valuetext={`${formatCurrency(actual)} realizados; ${budgeted > 0 ? `${formatCurrency(budgeted)} orçados (${percentage}%)` : "sem valor orçado"}`}
				title={`Orçado: ${formatCurrency(budgeted)}${percentage === null ? "" : ` · ${percentage}% realizado`}`}
			>
				<div
					className={`${styles.budgetFill} ${exceeded ? styles.budgetExceeded : ""}`}
					style={{
						width: `${percentage === null ? (actual > 0 ? 100 : 0) : Math.min(100, Math.max(0, percentage))}%`,
					}}
				/>
			</div>
			<span className={styles.budgetReference}>{budgetMessage}</span>
		</div>
	)
}

function BudgetGroup({ group }: { group: BudgetReportGroup }) {
	const [expanded, setExpanded] = useState(false)
	return (
		<Fragment>
			<tr className={`${styles.groupRow} ${expanded ? styles.expanded : ""}`}>
				<th scope="row">
					<button
						type="button"
						onClick={() => setExpanded(!expanded)}
						aria-expanded={expanded}
						aria-label={`${expanded ? "Recolher" : "Expandir"} grupo ${group.name}`}
					>
						{expanded ? <ChevronDown size={17} /> : <ChevronRight size={17} />}
						{group.name}
					</button>
				</th>
				<td>
					<BudgetActual
						actual={group.actual}
						budgeted={group.budgeted}
						income={group.type === "INCOME"}
					/>
				</td>
			</tr>
			{expanded &&
				group.items.map((item) => (
					<tr key={item.categoryId} className={styles.categoryRow}>
						<th scope="row">{item.categoryName}</th>
						<td>
							<BudgetActual
								actual={item.actual}
								budgeted={item.budgeted}
								income={group.type === "INCOME"}
							/>
						</td>
					</tr>
				))}
		</Fragment>
	)
}

export function DashboardContent() {
	const router = useRouter()
	const pathname = usePathname()
	const searchParams = useSearchParams()
	const [today] = useState(() => new Date())
	const year = Number(searchParams.get("year"))
	const month = Number(searchParams.get("month"))
	const period = {
		year:
			Number.isInteger(year) && year >= 2000 && year <= 2100
				? year
				: today.getFullYear(),
		month:
			Number.isInteger(month) && month >= 1 && month <= 12
				? month
				: today.getMonth() + 1,
	}
	const query = useQuery({
		queryKey: ["dashboard", "overview", period.year, period.month],
		queryFn: async () => {
			const result = await getDashboardOverview(period.year, period.month)
			if (!result.success) throw new Error(result.error)
			return result.data
		},
		staleTime: 5 * 60 * 1000,
	})
	const data = query.data
	const monthLabel = new Intl.DateTimeFormat("pt-BR", {
		month: "long",
		year: "numeric",
	}).format(new Date(period.year, period.month - 1, 1))
	const changeMonth = (offset: number) => {
		const next = new Date(period.year, period.month - 1 + offset, 1)
		const params = new URLSearchParams(searchParams.toString())
		params.set("year", String(next.getFullYear()))
		params.set("month", String(next.getMonth() + 1))
		router.push(`${pathname}?${params.toString()}`, { scroll: false })
	}
	const metrics = data
		? [
				{
					label: "Receitas",
					icon: ArrowUp,
					actual: data.income.actual,
					budgeted: data.income.budgeted,
				},
				{
					label: "Despesas",
					icon: ArrowDown,
					actual: data.outgoing.actual,
					budgeted: data.outgoing.budgeted,
				},
				{
					label: "Resultado",
					icon: Equal,
					actual: data.income.actual - data.outgoing.actual,
					budgeted: data.income.budgeted - data.outgoing.budgeted,
				},
			]
		: []

	return (
		<div className={styles.dashboard}>
			<header className={styles.header}>
				<h1>Visão geral</h1>
				<nav className={styles.monthPicker} aria-label="Mês do dashboard">
					<button
						type="button"
						aria-label="Mês anterior"
						disabled={period.year === 2000 && period.month === 1}
						onClick={() => changeMonth(-1)}
					>
						<ChevronLeft size={20} />
					</button>
					<span aria-live="polite">{monthLabel}</span>
					<button
						type="button"
						aria-label="Próximo mês"
						disabled={period.year === 2100 && period.month === 12}
						onClick={() => changeMonth(1)}
					>
						<ChevronRight size={20} />
					</button>
				</nav>
			</header>

			{query.isPending ? (
				<div
					className={styles.loading}
					role="status"
					aria-label="Carregando visão geral"
				>
					<div className={styles.loadingSummary} />
					<div className={styles.loadingGoals} />
					<div className={styles.loadingTable} />
					<span>Carregando sua visão geral…</span>
				</div>
			) : query.isError ? (
				<section className={styles.error} role="alert">
					<h2>Não foi possível carregar este mês</h2>
					<p>{query.error.message}</p>
					<button type="button" onClick={() => void query.refetch()}>
						Tentar novamente
					</button>
				</section>
			) : (
				data && (
					<>
						<section aria-label="Resumo do mês">
							<div className={styles.summary}>
								{metrics.map(
									({ label, icon: Icon, actual, budgeted }, index) => (
										<div className={styles.metric} key={label}>
											<div className={styles.metricIcon}>
												<Icon size={26} strokeWidth={1.8} aria-hidden="true" />
											</div>
											<div className={styles.metricBody}>
												<h3>{label}</h3>
												<p className={styles.metricValue}>
													{index === 2
														? signedCurrency(actual)
														: formatCurrency(actual)}
												</p>
												<p className={styles.budgeted}>
													Orçado:{" "}
													{data.hasBudget
														? index === 2
															? signedCurrency(budgeted)
															: formatCurrency(budgeted)
														: "Não definido"}
												</p>
											</div>
										</div>
									),
								)}
								<Target
									className={styles.summaryTarget}
									size={30}
									aria-hidden="true"
								/>
							</div>
						</section>

						<section className={styles.section} aria-labelledby="goals-title">
							<div className={styles.sectionHeading}>
								<h2 id="goals-title">Minhas metas</h2>
								<Link href="/investments" className={styles.textLink}>
									Investimentos <ArrowRight size={17} />
								</Link>
							</div>
							{data.goals.length ? (
								<div className={styles.goals}>
									{data.goals.slice(0, 3).map((goal) => {
										const percentage =
											goal.targetCents > 0
												? Math.max(
														0,
														Math.round(
															(goal.currentCents * 100) / goal.targetCents,
														),
													)
												: 0
										return (
											<Link
												key={goal.id}
												href={goal.href}
												className={styles.goalCard}
											>
												<div
													className={styles.vessel}
													role="progressbar"
													aria-label={goal.name}
													aria-valuemin={0}
													aria-valuemax={100}
													aria-valuenow={Math.min(100, percentage)}
													aria-valuetext={`${percentage}% da meta`}
												>
													{percentage > 0 && (
														<div
															className={styles.liquid}
															style={{
																height: `${Math.min(100, percentage)}%`,
															}}
														>
															{[styles.waveBack, styles.waveFront].map(
																(wave) => (
																	<svg
																		key={wave}
																		className={`${styles.wave} ${wave}`}
																		viewBox="0 0 120 12"
																		preserveAspectRatio="none"
																		aria-hidden="true"
																	>
																		<path d="M0 6 C10 0 20 0 30 6 S50 12 60 6 C70 0 80 0 90 6 S110 12 120 6 V12 H0 Z" />
																	</svg>
																),
															)}
														</div>
													)}
												</div>
												<div className={styles.goalBody}>
													<h3>{goal.name}</h3>
													<p>
														<strong>{formatCurrency(goal.currentCents)}</strong>{" "}
														de {formatCurrency(goal.targetCents)}
													</p>
													<span className={styles.percentage}>
														{percentage}%
													</span>
												</div>
												<ArrowRight
													className={styles.goalArrow}
													size={20}
													aria-hidden="true"
												/>
											</Link>
										)
									})}
								</div>
							) : (
								<div className={styles.emptyGoals}>
									<Target size={34} strokeWidth={1.5} aria-hidden="true" />
									<div>
										<h3>Seu próximo objetivo começa aqui</h3>
										<p>
											Defina uma meta de patrimônio e acompanhe sua evolução.
										</p>
									</div>
									<Link href="/investments" className={styles.outlineLink}>
										Criar minha meta <ArrowRight size={16} />
									</Link>
								</div>
							)}
							{data.goals.length > 0 && (
								<p className={styles.goalNote}>
									Metas de patrimônio usam o saldo atual. Metas de pagamento
									mostram o valor já pago em relação ao total da dívida.
								</p>
							)}
						</section>

						<section className={styles.section} aria-labelledby="budget-title">
							<div className={styles.sectionHeading}>
								<h2 id="budget-title">Como está seu orçamento</h2>
								<Link href="/budgets" className={styles.textLink}>
									Gerenciar <ArrowRight size={17} />
								</Link>
							</div>
							{!data.hasBudget && (
								<p className={styles.budgetNote}>
									Você ainda não definiu um orçamento para este mês. Os valores
									realizados continuam disponíveis abaixo.{" "}
									<Link href="/budgets">Definir orçamento</Link>
								</p>
							)}
							<p className={styles.budgetNote}>
								O detalhamento abaixo considera lançamentos categorizados. O
								resumo do mês inclui também os lançamentos sem categoria.
							</p>
							{data.groups.length ? (
								<div
									className={styles.tableScroll}
									tabIndex={0}
									role="region"
									aria-label="Orçamento por grupo e categoria"
								>
									<table className={styles.table}>
										<caption className="sr-only">
											Orçamento de {monthLabel}. Valores realizados por grupo e
											categoria, com barras proporcionais ao valor orçado.
										</caption>
										<thead>
											<tr>
												<th scope="col">Categoria</th>
												<th scope="col">Realizado</th>
											</tr>
										</thead>
										<tbody>
											{data.groups.map((group) => (
												<BudgetGroup
													key={`${period.year}-${period.month}-${group.type}-${group.name}`}
													group={group}
												/>
											))}
										</tbody>
									</table>
								</div>
							) : (
								<div className={styles.emptyBudget}>
									<p>Nenhuma categoria com valores neste mês.</p>
									<Link href="/events" className={styles.textLink}>
										Adicionar lançamento <ArrowRight size={16} />
									</Link>
								</div>
							)}
						</section>
					</>
				)
			)}
		</div>
	)
}
