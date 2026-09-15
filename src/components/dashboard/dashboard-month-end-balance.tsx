import { Landmark, PiggyBank, WalletCards } from "lucide-react"
import { formatCurrency, type Cents } from "@/types/finance"

interface DashboardMonthEndBalanceProps {
	availableBalance: Cents
	investmentBalance: Cents
	afterRedeemingInvestments: Cents
}

export function DashboardMonthEndBalance({
	availableBalance,
	investmentBalance,
	afterRedeemingInvestments,
}: DashboardMonthEndBalanceProps) {
	const requiredWithdrawal = Math.max(0, -availableBalance)
	const remainingInvestments = investmentBalance - requiredWithdrawal

	return (
		<div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-100 dark:border-slate-800">
			<p className="font-semibold text-slate-900 dark:text-white text-base">
				Saldo projetado no fim do mês
			</p>
			<p className="text-sm text-text-secondary mt-1">
				Considera todos os lançamentos planejados e parcelas deste mês.
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
			<div
				className={`mt-3 rounded-xl border p-3 ${afterRedeemingInvestments < 0 ? "border-danger/30 bg-danger/10" : "border-primary/20 bg-surface-brand"}`}
			>
				<div className="flex items-start gap-2">
					<WalletCards
						className={`mt-0.5 h-4 w-4 shrink-0 ${afterRedeemingInvestments < 0 ? "text-danger" : "text-primary"}`}
					/>
					<div>
						<p className="text-sm font-medium text-text-primary">
							Para cobrir os lançamentos do mês
						</p>
						{afterRedeemingInvestments < 0 ? (
							<p className="mt-1 text-sm text-danger">
								Saldo insuficiente. Faltariam{" "}
								{formatCurrency(Math.abs(afterRedeemingInvestments))} no fim do
								mês.
							</p>
						) : requiredWithdrawal > 0 ? (
							<p className="mt-1 text-sm text-text-secondary">
								Resgate {formatCurrency(requiredWithdrawal)}. Restarão{" "}
								<span className="financial-number font-semibold text-primary">
									{formatCurrency(remainingInvestments)} em investimentos
								</span>
								.
							</p>
						) : (
							<p className="mt-1 text-sm text-text-secondary">
								Você não precisa resgatar. Permanecerão{" "}
								<span className="financial-number font-semibold text-primary">
									{formatCurrency(investmentBalance)} em investimentos
								</span>
								.
							</p>
						)}
					</div>
				</div>
			</div>
		</div>
	)
}
