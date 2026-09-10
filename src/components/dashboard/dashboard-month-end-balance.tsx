import { Landmark, PiggyBank } from "lucide-react"
import { formatCurrency, type Cents } from "@/types/finance"

interface DashboardMonthEndBalanceProps {
	availableBalance: Cents
	investmentBalance: Cents
}

export function DashboardMonthEndBalance({
	availableBalance,
	investmentBalance,
}: DashboardMonthEndBalanceProps) {
	return (
		<div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-100 dark:border-slate-800">
			<p className="font-semibold text-slate-900 dark:text-white text-base">
				Saldo projetado no fim do mês
			</p>
			<p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
				Considera apenas os lançamentos planejados deste mês.
			</p>
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
				<div className="rounded-xl bg-slate-50 dark:bg-slate-800/70 p-3">
					<div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
						<Landmark className="w-4 h-4" />
						Saldo em conta
					</div>
					<p
						className={`font-semibold text-lg mt-1 ${
							availableBalance < 0
								? "text-red-600 dark:text-red-400"
								: "text-slate-900 dark:text-white"
						}`}
					>
						{formatCurrency(availableBalance)}
					</p>
				</div>
				<div className="rounded-xl bg-slate-50 dark:bg-slate-800/70 p-3">
					<div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
						<PiggyBank className="w-4 h-4" />
						Saldo em investimentos
					</div>
					<p
						className={`font-semibold text-lg mt-1 ${
							investmentBalance < 0
								? "text-red-600 dark:text-red-400"
								: "text-slate-900 dark:text-white"
						}`}
					>
						{formatCurrency(investmentBalance)}
					</p>
				</div>
			</div>
		</div>
	)
}
