"use client"

import { Spinner, Button } from "@nextui-org/react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { getDashboardData } from "@/features/dashboard"
import { getCategories } from "@/features/categories"
import { NewEventLauncher } from "@/components/events"
import { DashboardAlerts } from "./dashboard-alerts"
import { DashboardBalanceCard } from "./dashboard-balance-card"
import { DashboardMonthlyBudget } from "./dashboard-monthly-budget"

import { DashboardMonthEndBalance } from "./dashboard-month-end-balance"
import { DashboardSpendingLimit } from "./dashboard-spending-limit"
import { DashboardUpcomingEvents } from "./dashboard-upcoming-events"

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
	const categoriesQuery = useQuery({
		queryKey: ["categories"],
		queryFn: async () => {
			const result = await getCategories()
			if (!result.success) throw new Error(result.error)
			return result.categories
		},
		staleTime: 5 * 60 * 1000,
	})
	const data = dashboardQuery.data ?? null
	const categories = categoriesQuery.data ?? []
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
					{error instanceof Error ? error.message : "Não foi possível carregar a dashboard"}
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

	const investmentBalance = data.accounts
		.filter((account) => account.type === "INVESTMENT")
		.reduce((total, account) => total + account.currentBalance, 0)

	return (
		<div className="space-y-4 sm:space-y-6 max-w-4xl mx-auto">
			<DashboardBalanceCard availableBalance={data.availableBalance} />
			<DashboardAlerts
				criticalEvents={data.criticalEvents}
				daysUntilNegative={data.projectionSummary.daysUntilNegative}
			/>
			<DashboardSpendingLimit
				breakdown={data.spendingLimit.breakdown}
				investmentBalance={investmentBalance}
			/>
			<DashboardMonthEndBalance
				availableBalance={data.monthEndBalances.available}
				investmentBalance={data.monthEndBalances.investments}
			/>
			{data.monthlyBudget && (
				<DashboardMonthlyBudget monthlyBudget={data.monthlyBudget} />
			)}

			<DashboardUpcomingEvents events={data.upcomingEvents} />
				<NewEventLauncher
					mode="bubble"
					accounts={data.accounts}
					categories={categories}
					onSuccess={invalidateDashboard}
				/>
		</div>
	)
}
