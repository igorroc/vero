import type { Metadata } from "next"
import { BudgetReportContent } from "@/components/budgets"

export const metadata: Metadata = { title: "Orçamento Mensal | Vero" }

export default function BudgetReportPage() {
	return <BudgetReportContent />
}
