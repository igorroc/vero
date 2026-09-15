import Link from "next/link"
import { ChevronRight, TrendingUp } from "lucide-react"
import type { DashboardData } from "@/features/dashboard"
import { formatCurrency } from "@/types/finance"

interface DashboardMonthlyBudgetProps {
	monthlyBudget: NonNullable<DashboardData["monthlyBudget"]>
}

export function DashboardMonthlyBudget({
	monthlyBudget,
}: DashboardMonthlyBudgetProps) {
	const insightColors =
		monthlyBudget.insight.tone === "success"
			? "bg-emerald-50 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-200"
			: monthlyBudget.insight.tone === "danger"
				? "bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-200"
				: "bg-amber-50 text-amber-800 dark:bg-amber-900/20 dark:text-amber-200"

	return (
		<section className="modern-card p-4 sm:p-5">
			<div className="mb-4 flex items-center justify-between">
				<div>
					<h2 className="text-base font-semibold text-slate-900 dark:text-white sm:text-lg">
						Orçamento por categoria
					</h2>
					<p className="text-xs text-slate-500 sm:text-sm">
						Orçamento versus realizado
					</p>
				</div>
				<Link
					href="/reports/budget"
					className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
				>
					Ver orçamento mensal <ChevronRight className="h-4 w-4" />
				</Link>
			</div>
			<div className="grid gap-3 sm:grid-cols-2">
				<div className="rounded-xl bg-emerald-50 p-3 dark:bg-emerald-900/20">
					<p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
						Receitas realizadas
					</p>
					<p className="mt-1 text-lg font-semibold text-emerald-800 dark:text-emerald-200">
						{formatCurrency(monthlyBudget.income.actual)}
					</p>
					<p className="text-xs text-emerald-700 dark:text-emerald-300">
						Orçado: {formatCurrency(monthlyBudget.income.budgeted)}
					</p>
				</div>
				<div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
					<p className="text-xs font-medium text-slate-600 dark:text-slate-300">
						Saídas realizadas
					</p>
					<p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
						{formatCurrency(monthlyBudget.outgoing.actual)}
					</p>
					<p className="text-xs text-slate-500">
						Orçado: {formatCurrency(monthlyBudget.outgoing.budgeted)}
					</p>
				</div>
			</div>
			{monthlyBudget.categories.length > 0 && (
				<div className="mt-4 space-y-3">
					{monthlyBudget.categories.map((category) => {
						const progress = Math.min(
							100,
							Math.max(0, category.executionPercent),
						)
						const isOverBudget = category.remaining < 0
						return (
							<div key={category.name}>
								<div className="flex items-baseline justify-between gap-3 text-sm">
									<p className="font-medium text-text-primary">
										{category.name}
									</p>
									<p
										className={
											isOverBudget
												? "financial-number text-danger"
												: "financial-number text-text-secondary"
										}
									>
										{formatCurrency(category.actual)} de{" "}
										{formatCurrency(category.budgeted)}
									</p>
								</div>
								<div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-muted">
									<div
										className={
											isOverBudget
												? "h-full rounded-full bg-danger"
												: "h-full rounded-full bg-primary"
										}
										style={{ width: `${progress}%` }}
									/>
								</div>
								<p
									className={
										isOverBudget
											? "mt-1 text-xs text-danger"
											: "mt-1 text-xs text-text-muted"
									}
								>
									{isOverBudget
										? `${formatCurrency(Math.abs(category.remaining))} acima do orçamento`
										: `${formatCurrency(category.remaining)} restantes`}
								</p>
							</div>
						)
					})}
				</div>
			)}
			<div className={`mt-3 flex gap-3 rounded-xl p-3 ${insightColors}`}>
				<TrendingUp className="h-5 w-5 shrink-0" />
				<p className="text-sm">{monthlyBudget.insight.message}</p>
			</div>
		</section>
	)
}
