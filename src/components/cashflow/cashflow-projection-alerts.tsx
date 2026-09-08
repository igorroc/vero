import { formatCurrency, type CashflowProjection } from "@/types/finance"
import { AlertTriangle } from "lucide-react"

interface CashflowProjectionAlertsProps {
	projection: CashflowProjection
}

function formatDate(date: Date) {
	return new Date(date).toLocaleDateString("pt-BR", {
		weekday: "short",
		month: "short",
		day: "numeric",
	})
}

export function CashflowProjectionAlerts({ projection }: CashflowProjectionAlertsProps) {
	if (projection.negativeDays > 0) {
		return <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-4 sm:p-5 border border-red-200 dark:border-red-800"><div className="flex items-start gap-3"><div className="w-10 h-10 bg-red-100 dark:bg-red-800/50 rounded-xl flex items-center justify-center flex-shrink-0"><AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" /></div><div><h3 className="font-semibold text-red-900 dark:text-red-100 text-sm sm:text-base">{projection.negativeDays} dia{projection.negativeDays > 1 ? "s" : ""} com saldo negativo</h3>{projection.lowestBalanceDate && <p className="text-xs sm:text-sm text-red-600 dark:text-red-400 mt-1">Menor saldo: {formatCurrency(projection.lowestBalance)} em {formatDate(projection.lowestBalanceDate)}</p>}</div></div></div>
	}

	if (projection.criticalDays > 0) {
		return <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-4 sm:p-5 border border-amber-200 dark:border-amber-800"><div className="flex items-start gap-3"><div className="w-10 h-10 bg-amber-100 dark:bg-amber-800/50 rounded-xl flex items-center justify-center flex-shrink-0"><AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" /></div><div><h3 className="font-semibold text-amber-900 dark:text-amber-100 text-sm sm:text-base">{projection.criticalDays} dia{projection.criticalDays > 1 ? "s" : ""} abaixo da reserva de segurança</h3></div></div></div>
	}

	return null
}
