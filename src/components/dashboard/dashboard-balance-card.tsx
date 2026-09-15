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
		<div className="modern-card p-4 sm:p-5">
			<div className="flex items-center justify-between gap-4">
				<div>
					<p className="text-sm font-medium text-text-secondary">
						Saldo disponível hoje
					</p>
					<p className="financial-number mt-1 text-2xl font-semibold text-text-primary sm:text-3xl">
						{formatCurrency(availableBalance)}
					</p>
				</div>

				<Link
					href="/accounts"
					className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-primary hover:text-primary-hover"
				>
					Ver detalhes <ChevronRight className="w-4 h-4" />
				</Link>
			</div>
		</div>
	)
}
