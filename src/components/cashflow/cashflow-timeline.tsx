"use client"

import { useEffect, useState } from "react"
import {
	Spinner,
	Button,
} from "@nextui-org/react"
import { getCashflowProjection } from "@/features/cashflow"
import { formatCurrency, type CashflowProjection } from "@/types/finance"
import {
	AlertTriangle,
	Calendar,
	ArrowUpRight,
	ArrowDownRight,
} from "lucide-react"
import { CashflowDayRow } from "./cashflow-day-row"
import { CashflowPeriodSelector } from "./cashflow-period-selector"
import { CashflowProjectionAlerts } from "./cashflow-projection-alerts"
import { CashflowProjectionSummary } from "./cashflow-projection-summary"

export function CashflowTimeline() {
	const [projection, setProjection] = useState<CashflowProjection | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [days, setDays] = useState(30)

	useEffect(() => {
		loadProjection()
	}, [days])

	const loadProjection = async () => {
		setLoading(true)
		setError(null)

		const result = await getCashflowProjection(days)

		if (result.success) {
			setProjection(result.projection)
		} else {
			setError(result.error)
		}

		setLoading(false)
	}

	const isToday = (date: Date) => {
		const today = new Date()
		const d = new Date(date)
		return d.toDateString() === today.toDateString()
	}

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<Spinner size="lg" label="Carregando projeção..." />
			</div>
		)
	}

	if (error) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[400px] gap-4 px-4">
				<div className="bg-red-100 dark:bg-red-900/30 rounded-2xl p-6 text-center">
					<AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
					<p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
				</div>
				<Button color="primary" onPress={loadProjection} className="rounded-xl">
					Tentar Novamente
				</Button>
			</div>
		)
	}

	if (!projection) {
		return null
	}

	return (
		<div className="space-y-4 sm:space-y-6 max-w-4xl mx-auto">
			{/* Header Card with Net Change */}
			<div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 rounded-2xl sm:rounded-3xl p-5 sm:p-6 text-white relative overflow-hidden">
				{/* Decorative elements */}
				<div className="absolute top-0 right-0 w-32 h-32 pointer-events-none">
					<div className="absolute top-4 right-4 w-12 h-12 bg-pink-500/40 rounded-full blur-sm" />
					<div className="absolute top-8 right-12 w-8 h-8 bg-yellow-400/60 rounded-full" />
				</div>
				<div className="absolute bottom-0 left-0 w-24 h-24 pointer-events-none">
					<div className="absolute bottom-4 left-4 w-16 h-16 bg-blue-400/30 rounded-full blur-md" />
				</div>

				<div className="relative">
					<div className="flex items-center justify-between mb-4">
						<div className="flex items-center gap-2">
							<Calendar className="w-5 h-5 text-white/70" />
							<span className="text-white/70 text-sm">
								Projeção de {days} dias
							</span>
						</div>

						<CashflowPeriodSelector days={days} onDaysChange={setDays} />
					</div>

					<p className="text-white/70 text-sm mb-1">
						Variação Líquida no Período
					</p>
					<div className="flex items-baseline gap-2">
						<span className="text-3xl sm:text-4xl font-bold">
							{projection.netChange >= 0 ? "+" : ""}
							{formatCurrency(projection.netChange)}
						</span>
						{projection.netChange >= 0 ? (
							<ArrowUpRight className="w-6 h-6 text-emerald-400" />
						) : (
							<ArrowDownRight className="w-6 h-6 text-red-400" />
						)}
					</div>
				</div>
			</div>

			<CashflowProjectionSummary projection={projection} />

			<CashflowProjectionAlerts projection={projection} />

			{/* Timeline */}
			<div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-800">
				<div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-700">
					<h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">
						Detalhamento Diário
					</h2>
					<p className="text-xs sm:text-sm text-slate-500 mt-0.5">
						Toque em um dia para ver os eventos
					</p>
				</div>
				<div className="divide-y divide-slate-100 dark:divide-slate-800">
					{projection.days.map((day) => (
						<CashflowDayRow
							key={day.dateKey}
							day={day}
							isToday={isToday(day.date)}
						/>
					))}
				</div>
			</div>
		</div>
	)
}
