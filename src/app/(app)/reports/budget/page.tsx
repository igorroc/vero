import type { Metadata } from "next"
import { BudgetReportContent } from "@/components/budgets"
import { PageHeader } from "@/components/ui"

export const metadata: Metadata = { title: "Relatório de Orçamento | Vero" }

export default function BudgetReportPage() {
	return (
		<>
			<PageHeader
				title="Relatório de orçamento"
				subtitle="Compare o planejado com os eventos confirmados"
			/>
			<BudgetReportContent />
		</>
	)
}
