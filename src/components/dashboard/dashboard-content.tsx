"use client"

import { Spinner, Button } from "@nextui-org/react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { getDashboardData } from "@/features/dashboard"
import { DashboardAlerts } from "./dashboard-alerts"
import { DashboardBalanceCard } from "./dashboard-balance-card"
import { DashboardMonthlyBudget } from "./dashboard-monthly-budget"
import { DashboardBalanceChart } from "./dashboard-balance-chart"
import { DashboardMonthlyComparison } from "./dashboard-monthly-comparison"
import { DashboardMonthEndBalance } from "./dashboard-month-end-balance"
import { DashboardSpendingLimit } from "./dashboard-spending-limit"
import { DashboardUpcomingEvents } from "./dashboard-upcoming-events"
import { OnboardingChecklist } from "./onboarding-checklist"

export function DashboardContent() {
	const queryClient = useQueryClient()
	const dashboardQuery = useQuery({
		queryKey: ["dashboard"],
		queryFn: async () => {
			const result = await getDashboardData()
			if (!result.success) throw new Error(result.error)
			return result.data
		},
		staleTime: 5 * 60 * 1000,
	})
	const data = dashboardQuery.data ?? null
	const error = dashboardQuery.error
	const invalidateDashboard = () => {
		void queryClient.invalidateQueries({ queryKey: ["dashboard"] })
	}

	if (dashboardQuery.isLoading) {
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<Spinner size="lg" label="Carregando dashboard..." />
			</div>
		)
	}

	if (error) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
				<p className="text-red-500">
					{error instanceof Error
						? error.message
						: "Não foi possível carregar a dashboard"}
				</p>
				<Button color="primary" onPress={() => void dashboardQuery.refetch()}>
					Tentar Novamente
				</Button>
			</div>
		)
	}

	if (!data) {
		return null
	}

	return (
		<div className="space-y-4 sm:space-y-6 max-w-4xl mx-auto">
			<OnboardingChecklist onPreviewStarted={invalidateDashboard} />
			{data.spendingLimit && (
				<DashboardSpendingLimit breakdown={data.spendingLimit.breakdown} />
			)}
			<DashboardBalanceCard availableBalance={data.availableBalance} />
			<DashboardAlerts
				criticalEvents={data.criticalEvents}
				daysUntilNegative={data.projectionSummary.daysUntilNegative}
			/>
			<DashboardBalanceChart
				series={data.monthlyBalanceSeries}
				safetyBuffer={data.safetyBuffer}
			/>
			<DashboardMonthEndBalance
				availableBalance={data.monthEndBalances.available}
				investmentBalance={data.monthEndBalances.investments}
				afterRedeemingInvestments={
					data.monthEndBalances.afterRedeemingInvestments
				}
			/>
			{data.monthlyBudget && (
				<DashboardMonthlyBudget monthlyBudget={data.monthlyBudget} />
			)}
			<DashboardMonthlyComparison comparison={data.monthlyComparison} />

			<DashboardUpcomingEvents events={data.upcomingEvents} />
		</div>
	)
}
