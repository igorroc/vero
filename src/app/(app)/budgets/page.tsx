import type { Metadata } from "next"
import { BudgetsContent } from "@/components/budgets"
import { PageHeader } from "@/components/ui"

export const metadata: Metadata = { title: "Orçamentos | Vero" }

export default function BudgetsPage() {
	return (
		<>
			<PageHeader
				title="Orçamentos"
				subtitle="Defina os valores planejados por categoria"
			/>
			<BudgetsContent />
		</>
	)
}
