import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { formatCurrency, type Cents } from "@/types/finance"

interface DashboardBalanceCardProps {
	availableBalance: Cents
}

export function DashboardBalanceCard({
	availableBalance,
}: DashboardBalanceCardProps) {
	return (
		<div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 rounded-2xl sm:rounded-3xl p-5 sm:p-6 text-white relative overflow-hidden">
			<div className="absolute top-0 right-0 w-32 h-32 sm:w-40 sm:h-40">
				<div className="absolute top-4 right-4 w-12 h-12 sm:w-16 sm:h-16 bg-pink-500/40 rounded-full blur-sm" />
				<div className="absolute top-8 right-12 w-8 h-8 sm:w-10 sm:h-10 bg-yellow-400/60 rounded-full" />
				<div className="absolute top-16 right-6 w-6 h-6 sm:w-8 sm:h-8 bg-cyan-400/50 rounded-full" />
			</div>
			<div className="absolute -bottom-4 -left-4 w-24 h-24 bg-blue-500/20 rounded-full blur-xl" />

			<div className="relative z-10">
				<p className="text-indigo-200 text-sm font-medium">Saldo disponível</p>
				<p className="text-3xl sm:text-4xl font-bold mt-1 tracking-tight">
					{formatCurrency(availableBalance)}
				</p>

				<Link
					href="/accounts"
					className="inline-flex items-center gap-1 text-sm font-semibold text-white mt-4 hover:text-indigo-200 transition-colors"
				>
					Ver detalhes <ChevronRight className="w-4 h-4" />
				</Link>
			</div>
		</div>
	)
}
