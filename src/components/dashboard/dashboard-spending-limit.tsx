import { AlertTriangle, Target } from "lucide-react"
import type { DashboardData } from "@/features/dashboard"
import { formatCurrency } from "@/types/finance"

interface DashboardSpendingLimitProps {
	breakdown: DashboardData["spendingLimit"]["breakdown"]
}

export function DashboardSpendingLimit({
	breakdown,
}: DashboardSpendingLimitProps) {
	return breakdown.isNegative ? (
		<div className="bg-red-50 dark:bg-red-900/20 rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-red-200 dark:border-red-800">
			<div className="flex items-center justify-between">
				<div className="flex-1 min-w-0">
					<p className="font-semibold text-red-800 dark:text-red-200 text-base">
						Saldo insuficiente
					</p>
					<p className="text-sm text-red-600 dark:text-red-400 mt-1">
						Você precisa receber{" "}
						{formatCurrency(Math.abs(breakdown.availableForSpending))} nos
						próximos {breakdown.daysUntilHorizon} dias para cobrir suas despesas
						planejadas
					</p>
				</div>
				<div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center flex-shrink-0 ml-4">
					<AlertTriangle className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
				</div>
			</div>
		</div>
	) : (
		<div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-100 dark:border-slate-800">
			<div className="flex items-center justify-between">
				<div className="flex-1 min-w-0">
					<p className="font-semibold text-slate-900 dark:text-white text-base">
						Limite diário seguro
					</p>
					<p className="text-sm text-slate-500 mt-1">
						Você pode gastar {formatCurrency(breakdown.dailyLimit)} por dia nos
						próximos {breakdown.daysUntilHorizon} dias
					</p>
				</div>
				<div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center flex-shrink-0 ml-4">
					<Target className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
				</div>
			</div>
		</div>
	)
}
