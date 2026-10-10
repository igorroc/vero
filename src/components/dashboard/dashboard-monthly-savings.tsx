import { ArrowDownRight, ArrowUpRight, Minus, PiggyBank } from "lucide-react"
import type { MonthlySavingsResult } from "@/lib/engines/monthly-savings"
import { formatCurrency } from "@/types/finance"

interface DashboardMonthlySavingsProps {
	savings: MonthlySavingsResult
}

function formatRate(rate: number): string {
	return `${rate.toFixed(0)}% das entradas`
}

export function DashboardMonthlySavings({
	savings,
}: DashboardMonthlySavingsProps) {
	const { previsto, realizado, difference } = savings

	return (
		<section className="modern-card p-4 sm:p-5">
			<div className="mb-4 flex items-center gap-2">
				<div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
					<PiggyBank className="h-5 w-5" />
				</div>
				<div>
					<h2 className="text-base font-semibold text-slate-900 dark:text-white sm:text-lg">
						Quanto posso economizar
					</h2>
					<p className="text-xs text-slate-500 sm:text-sm">
						Economia do mês: previsto versus realizado
					</p>
				</div>
			</div>

			<div className="grid gap-3 sm:grid-cols-2">
				<div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
					<p className="text-xs font-medium text-slate-600 dark:text-slate-300">
						Previsto
					</p>
					<p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
						{formatCurrency(previsto.saved)}
					</p>
					<p className="text-xs text-slate-500">
						Economia total · {formatRate(previsto.savingsRate)}
					</p>
					<p className="mt-1 text-xs text-slate-500">
						Caixa livre: {formatCurrency(previsto.freeCash)}
					</p>
				</div>
				<div className="rounded-xl bg-emerald-50 p-3 dark:bg-emerald-900/20">
					<p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
						Realizado
					</p>
					<p className="mt-1 text-lg font-semibold text-emerald-800 dark:text-emerald-200">
						{formatCurrency(realizado.saved)}
					</p>
					<p className="text-xs text-emerald-700 dark:text-emerald-300">
						Economia total · {formatRate(realizado.savingsRate)}
					</p>
					<p className="mt-1 text-xs text-emerald-700 dark:text-emerald-300">
						Caixa livre: {formatCurrency(realizado.freeCash)}
					</p>
				</div>
			</div>

			<div className="mt-3 flex items-center gap-2 rounded-xl bg-surface-muted p-3 text-sm">
				<DifferenceIcon difference={difference.saved} />
				<p className="text-text-secondary">
					{difference.saved === 0
						? "Economia exatamente como o previsto."
						: difference.saved > 0
							? `Economizando ${formatCurrency(difference.saved)} mais que o previsto.`
							: `Economizando ${formatCurrency(Math.abs(difference.saved))} menos que o previsto.`}
				</p>
			</div>
		</section>
	)
}

function DifferenceIcon({ difference }: { difference: number }) {
	if (difference === 0) {
		return <Minus className="h-5 w-5 shrink-0 text-slate-400" />
	}
	if (difference > 0) {
		return (
			<ArrowUpRight className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
		)
	}
	return (
		<ArrowDownRight className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
	)
}
