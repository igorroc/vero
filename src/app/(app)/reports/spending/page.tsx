import type { Metadata } from "next"
import { SpendingByCategoryContent } from "@/components/reports"

export const metadata: Metadata = { title: "Gastos por Categoria | Vero" }

export default function SpendingByCategoryPage() {
	return <SpendingByCategoryContent />
}
