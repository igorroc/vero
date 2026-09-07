import type { Metadata } from "next"
import { BudgetReportContent } from "@/components/budgets"

export const metadata: Metadata = { title: "Relatório de Orçamento | Vero" }

export default function BudgetReportPage() {
	return <BudgetReportContent />
}
