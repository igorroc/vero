import { formatCurrency, type CashflowProjection } from "@/types/finance"
import { PiggyBank, TrendingDown, TrendingUp, Wallet } from "lucide-react"

interface CashflowProjectionSummaryProps {
	projection: CashflowProjection
}

export function CashflowProjectionSummary({
	projection,
}: CashflowProjectionSummaryProps) {
	const summaryItems = [
		{ label: "Receitas", value: projection.totalIncome, Icon: TrendingUp, colors: "bg-cyan-100 dark:bg-cyan-900/30", iconColors: "bg-cyan-500/20 text-cyan-600 dark:text-cyan-400", textColors: "text-cyan-700 dark:text-cyan-300", valueColors: "text-cyan-900 dark:text-cyan-100" },
		{ label: "Despesas", value: projection.totalExpenses, Icon: TrendingDown, colors: "bg-pink-100 dark:bg-pink-900/30", iconColors: "bg-pink-500/20 text-pink-600 dark:text-pink-400", textColors: "text-pink-700 dark:text-pink-300", valueColors: "text-pink-900 dark:text-pink-100" },
		{ label: "Investimentos", value: projection.totalInvestments, Icon: PiggyBank, colors: "bg-purple-100 dark:bg-purple-900/30", iconColors: "bg-purple-500/20 text-purple-600 dark:text-purple-400", textColors: "text-purple-700 dark:text-purple-300", valueColors: "text-purple-900 dark:text-purple-100" },
		{ label: "Saldo Final", value: projection.days.length > 0 ? projection.days[projection.days.length - 1].endingBalance : 0, Icon: Wallet, colors: "bg-amber-100 dark:bg-amber-900/30", iconColors: "bg-amber-500/20 text-amber-600 dark:text-amber-400", textColors: "text-amber-700 dark:text-amber-300", valueColors: "text-amber-900 dark:text-amber-100" },
	]

	return (
		<div className="grid grid-cols-2 gap-3 sm:gap-4">
			{summaryItems.map(({ label, value, Icon, colors, iconColors, textColors, valueColors }) => (
				<div key={label} className={`${colors} rounded-2xl p-4 sm:p-5`}>
					<div className="flex items-center gap-2 mb-2">
						<div className={`w-8 h-8 rounded-xl flex items-center justify-center ${iconColors}`}>
							<Icon className="w-4 h-4" />
						</div>
						<span className={`text-xs sm:text-sm ${textColors}`}>{label}</span>
					</div>
					<p className={`text-lg sm:text-xl font-bold ${valueColors}`}>
						{formatCurrency(value)}
					</p>
				</div>
			))}
		</div>
	)
}
