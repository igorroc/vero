import { AlertTriangle } from "lucide-react"
import type { DashboardData } from "@/features/dashboard"

interface DashboardAlertsProps {
	criticalEvents: DashboardData["criticalEvents"]
	daysUntilNegative: DashboardData["projectionSummary"]["daysUntilNegative"]
}

export function DashboardAlerts({
	criticalEvents,
	daysUntilNegative,
}: DashboardAlertsProps) {
	if (criticalEvents.length === 0 && daysUntilNegative === null) {
		return null
	}

	return (
		<div className="space-y-3">
			{criticalEvents.length > 0 && (
				<div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4">
					<div className="flex items-center gap-3">
						<div className="p-2 bg-red-100 dark:bg-red-800 rounded-xl flex-shrink-0">
							<AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
						</div>
						<div className="min-w-0">
							<p className="font-semibold text-red-800 dark:text-red-200 text-sm">
								{criticalEvents.length} evento(s) crítico(s)
							</p>
							<p className="text-xs text-red-600 dark:text-red-300 truncate">
								{criticalEvents[0]?.description}
							</p>
						</div>
					</div>
				</div>
			)}

			{daysUntilNegative !== null && (
				<div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4">
					<div className="flex items-center gap-3">
						<div className="p-2 bg-amber-100 dark:bg-amber-800 rounded-xl flex-shrink-0">
							<AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
						</div>
						<div>
							<p className="font-semibold text-amber-800 dark:text-amber-200 text-sm">
								Saldo negativo em {daysUntilNegative} dias
							</p>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}
