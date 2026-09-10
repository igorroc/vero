"use client"

import { useEffect, useState } from "react"
import { Spinner, Button } from "@nextui-org/react"
import { getDashboardData, type DashboardData } from "@/features/dashboard"
import { DashboardAlerts } from "./dashboard-alerts"
import { DashboardBalanceCard } from "./dashboard-balance-card"
import { DashboardMonthlyBudget } from "./dashboard-monthly-budget"

import { DashboardMonthEndBalance } from "./dashboard-month-end-balance"
import { DashboardSpendingLimit } from "./dashboard-spending-limit"
import { DashboardUpcomingEvents } from "./dashboard-upcoming-events"

export function DashboardContent() {
	const [data, setData] = useState<DashboardData | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		loadDashboard()
	}, [])

	const loadDashboard = async () => {
		setLoading(true)
		setError(null)

		const result = await getDashboardData()

		if (result.success) {
			setData(result.data)
		} else {
			setError(result.error)
		}

		setLoading(false)
	}

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<Spinner size="lg" label="Carregando dashboard..." />
			</div>
		)
	}

	if (error) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
				<p className="text-red-500">{error}</p>
				<Button color="primary" onPress={loadDashboard}>
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
		</div>
	)
}
