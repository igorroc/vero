"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Button, Spinner } from "@nextui-org/react"
import {
	BadgePercent,
	Banknote,
	Building2,
	Car,
	CreditCard,
	Heart,
	Home,
	Music,
	Phone,
	ReceiptText,
	Scissors,
	ShoppingCart,
	Utensils,
	Zap,
	type LucideIcon,
} from "lucide-react"
import { getCurrentSpendingByCategory } from "@/features/reports"
import { eventIconDefinitions, type EventIconKey } from "@/lib/event-icon-rules"
import type { SpendingIconGroup } from "@/lib/engines/spending-by-category"
import { formatCurrency } from "@/types/finance"

const eventIcons: Record<EventIconKey, LucideIcon> = {
	property: Building2,
	beauty: Scissors,
	income: Banknote,
	adjustment: BadgePercent,
	bill: ReceiptText,
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

export function SpendingByCategoryContent() {
	const [groups, setGroups] = useState<SpendingIconGroup[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		getCurrentSpendingByCategory().then((result) => {
			if (result.success) setGroups(result.groups)
			else setError(result.error)
			setLoading(false)
		})
	}, [])

	if (loading) {
		return (
			<div className="flex min-h-64 items-center justify-center">
				<Spinner label="Carregando gastos do mês..." />
			</div>
		)
	}

	const total = groups.reduce((sum, group) => sum + group.total, 0)
	const monthLabel = new Intl.DateTimeFormat("pt-BR", {
		month: "long",
		year: "numeric",
	}).format(new Date())
	let progress = 0
	const gradient = groups
		.map((group) => {
			const start = progress
			progress += (group.total / total) * 100
			return `${eventIconDefinitions[group.iconKey].color} ${start}% ${progress}%`
		})
		.join(", ")

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
				<Button as={Link} href="/reports/budget" variant="bordered">
					Ver orçamento mensal
				</Button>
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
								role="img"
								aria-label="Distribuição dos gastos confirmados por tipo"
								className="h-52 w-52 shrink-0 rounded-full shadow-inner"
								style={{ background: `conic-gradient(${gradient})` }}
							/>
							<div className="w-full">
								<p className="text-sm text-slate-500">Total gasto no mês</p>
								<h2
									id="chart-heading"
									className="mt-1 text-3xl font-bold text-slate-900 dark:text-white"
								>
									{formatCurrency(total)}
								</h2>
								<p className="mt-2 text-sm text-slate-500">
									Cada fatia agrupa lançamentos pelas palavras-chave dos ícones.
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
								Categorias registradas em cada grupo do gráfico.
							</p>
						</div>
						<div className="grid gap-3 lg:grid-cols-2">
							{groups.map((group) => {
								const definition = eventIconDefinitions[group.iconKey]
								const Icon = eventIcons[group.iconKey]
								const percentage = (group.total / total) * 100

								return (
									<article
										key={group.iconKey}
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
														{definition.label}
													</h3>
													<p className="text-xs text-slate-500">
														{percentage.toFixed(1)}% dos gastos
													</p>
												</div>
											</div>
											<p className="font-semibold text-slate-900 dark:text-white">
												{formatCurrency(group.total)}
											</p>
										</div>
										<div className="divide-y divide-slate-100 border-t border-slate-100 dark:divide-slate-800 dark:border-slate-800">
											{group.categories.map((category) => (
												<div
													key={category.name}
													className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm"
												>
													<span className="text-slate-600 dark:text-slate-300">
														{category.name}
													</span>
													<span className="font-medium text-slate-900 dark:text-white">
														{formatCurrency(category.amount)}
													</span>
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
