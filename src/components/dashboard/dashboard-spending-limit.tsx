import { AlertTriangle, Target } from "lucide-react"
import type { DashboardData } from "@/features/dashboard"
import { formatCurrency } from "@/types/finance"

interface DashboardSpendingLimitProps {
	breakdown: NonNullable<DashboardData["spendingLimit"]>["breakdown"]
}

export function DashboardSpendingLimit({
	breakdown,
}: DashboardSpendingLimitProps) {
	return breakdown.isNegative ? (
		<div className="rounded-2xl border border-danger/30 bg-danger/10 p-4 sm:rounded-3xl sm:p-5">
			<div className="flex items-center justify-between">
				<div className="flex-1 min-w-0">
					<p className="text-base font-semibold text-danger">
						Sem margem para gastar
					</p>
					<p className="mt-1 text-sm text-text-secondary">
						Os lançamentos e a reserva comprometem{" "}
						{formatCurrency(Math.abs(breakdown.availableForSpending))} até o
						horizonte.
					</p>
				</div>
				<div className="ml-4 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-danger sm:h-14 sm:w-14">
					<AlertTriangle className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
				</div>
			</div>
		</div>
	) : (
		<div className="relative overflow-hidden rounded-2xl bg-primary p-5 text-primary-foreground shadow-surface sm:rounded-3xl sm:p-6">
			<div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-accent/30" />
			<div className="flex items-center justify-between">
				<div className="flex-1 min-w-0">
					<p className="text-sm font-medium text-primary-foreground/75">
						Você pode gastar nesta semana
					</p>
					<p className="financial-number mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
						{formatCurrency(breakdown.weeklyLimit)}
					</p>
					<p className="mt-2 text-sm text-primary-foreground/75">
						Sem comprometer lançamentos e reserva nos próximos{" "}
						{breakdown.daysUntilHorizon} dias.
					</p>
				</div>
				<div className="ml-4 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-foreground/15 sm:h-14 sm:w-14">
					<Target className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
				</div>
			</div>
		</div>
	)
}
