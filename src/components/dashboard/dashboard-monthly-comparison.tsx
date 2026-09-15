import type { DashboardData } from "@/features/dashboard"
import { formatCurrency } from "@/types/finance"

interface DashboardMonthlyComparisonProps {
	comparison: DashboardData["monthlyComparison"]
}

function Difference({
	current,
	previous,
}: {
	current: number
	previous: number
}) {
	const difference = current - previous
	if (difference === 0)
		return <span className="text-text-muted">Igual ao mês anterior</span>
	return (
		<span className={difference > 0 ? "text-danger" : "text-positive"}>
			{difference > 0 ? "+" : ""}
			{formatCurrency(difference)} vs. mês anterior
		</span>
	)
}

export function DashboardMonthlyComparison({
	comparison,
}: DashboardMonthlyComparisonProps) {
	return (
		<section className="modern-card p-4 sm:p-5">
			<h2 className="text-base font-semibold text-text-primary sm:text-lg">
				Comparativo mensal
			</h2>
			<p className="mt-0.5 text-sm text-text-secondary">
				Lançamentos confirmados neste mês versus o anterior.
			</p>
			<div className="mt-4 grid gap-3 sm:grid-cols-2">
				<div className="rounded-xl bg-surface-muted p-3">
					<p className="text-xs font-medium text-text-secondary">Receitas</p>
					<p className="financial-number mt-1 text-lg font-semibold text-text-primary">
						{formatCurrency(comparison.income.current)}
					</p>
					<p className="mt-1 text-xs">
						<Difference
							current={comparison.income.current}
							previous={comparison.income.previous}
						/>
					</p>
				</div>
				<div className="rounded-xl bg-surface-muted p-3">
					<p className="text-xs font-medium text-text-secondary">Saídas</p>
					<p className="financial-number mt-1 text-lg font-semibold text-text-primary">
						{formatCurrency(comparison.outgoing.current)}
					</p>
					<p className="mt-1 text-xs">
						<Difference
							current={comparison.outgoing.current}
							previous={comparison.outgoing.previous}
						/>
					</p>
				</div>
			</div>
		</section>
	)
}
