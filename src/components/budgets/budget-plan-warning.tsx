import { AlertTriangle } from "lucide-react"
import type { BudgetPlanAdjustment } from "@/lib/engines/budget-report"
import { formatCurrency } from "@/types/finance"

const typeLabels = {
	ESSENTIAL: "Essencial",
	LIFESTYLE: "Estilo de vida",
	INVESTMENT: "Investimentos",
} as const

interface BudgetPlanWarningProps {
	adjustment: BudgetPlanAdjustment
}

export function BudgetPlanWarning({ adjustment }: BudgetPlanWarningProps) {
	const reductions = Object.entries(adjustment.reductions).filter(
		([, amount]) => amount > 0,
	) as Array<[keyof typeof typeLabels, number]>

	return (
		<section
			className="rounded-xl border border-warning-200 bg-warning-50 p-4 text-warning-900 dark:border-warning-800 dark:bg-warning-950/30 dark:text-warning-100"
			aria-labelledby="budget-plan-warning-title"
		>
			<div className="flex gap-3">
				<AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
				<div className="space-y-2">
					<h2 id="budget-plan-warning-title" className="font-semibold">
						As saídas orçadas superam as entradas
					</h2>
					<p className="text-sm">
						Faltam {formatCurrency(adjustment.shortfall)} para equilibrar o
						planejamento. Reduza os valores abaixo proporcionalmente ou reveja
						as receitas previstas.
					</p>
					<div className="flex flex-wrap gap-2 text-sm font-medium">
						{reductions.map(([type, amount]) => (
							<span
								key={type}
								className="rounded-full bg-warning-100 px-2.5 py-1 dark:bg-warning-900/50"
							>
								{typeLabels[type]}: reduzir {formatCurrency(amount)}
							</span>
						))}
					</div>
				</div>
			</div>
		</section>
	)
}
