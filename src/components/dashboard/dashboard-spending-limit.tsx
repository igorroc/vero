import { AlertTriangle, Target } from "lucide-react"
import type { DashboardData } from "@/features/dashboard"
import { formatCurrency, type Cents } from "@/types/finance"

interface DashboardSpendingLimitProps {
	breakdown: DashboardData["spendingLimit"]["breakdown"]
	investmentBalance: Cents
}

export function DashboardSpendingLimit({
	breakdown,
	investmentBalance,
}: DashboardSpendingLimitProps) {
	const paymentShortfall = Math.max(
		0,
		breakdown.requiredExpenses +
			breakdown.plannedInvestments -
			breakdown.cashNow,
	)
	const suggestedWithdrawal = Math.min(investmentBalance, paymentShortfall)
	const remainingShortfall = paymentShortfall - suggestedWithdrawal
	const isSafetyBufferShortfall = paymentShortfall === 0

	return breakdown.isNegative ? (
		<div
			className={
				isSafetyBufferShortfall
					? "bg-amber-50 dark:bg-amber-900/20 rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-amber-200 dark:border-amber-800"
					: "bg-red-50 dark:bg-red-900/20 rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-red-200 dark:border-red-800"
			}
		>
			<div className="flex items-center justify-between">
				<div className="flex-1 min-w-0">
					<p
						className={`font-semibold text-base ${
							isSafetyBufferShortfall
								? "text-amber-800 dark:text-amber-200"
								: "text-red-800 dark:text-red-200"
						}`}
					>
						{isSafetyBufferShortfall
							? "Reserva de segurança comprometida"
							: "Saldo insuficiente"}
					</p>
					{isSafetyBufferShortfall ? (
						<p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
							O saldo em conta cobre os lançamentos planejados, mas ficará
							abaixo da sua reserva de segurança nos próximos{" "}
							{breakdown.daysUntilHorizon} dias.
						</p>
					) : (
						<>
							<p className="text-sm text-red-600 dark:text-red-400 mt-1">
								Faltam {formatCurrency(paymentShortfall)} no saldo disponível em
								conta para cobrir os lançamentos planejados nos próximos{" "}
								{breakdown.daysUntilHorizon} dias.
							</p>
							{investmentBalance > 0 && (
								<p className="text-sm text-red-600 dark:text-red-400 mt-1">
									Você tem {formatCurrency(investmentBalance)} em contas de
									investimento. Considere resgatar{" "}
									{formatCurrency(suggestedWithdrawal)} para cobrir a diferença.
									{remainingShortfall > 0 &&
										` Ainda faltarão ${formatCurrency(remainingShortfall)}.`}
								</p>
							)}
						</>
					)}
				</div>
				<div
					className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center flex-shrink-0 ml-4 ${
						isSafetyBufferShortfall
							? "bg-gradient-to-br from-amber-400 to-amber-600"
							: "bg-gradient-to-br from-red-400 to-red-600"
					}`}
				>
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
