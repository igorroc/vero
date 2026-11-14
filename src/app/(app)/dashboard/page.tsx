import { Suspense } from "react"
import { DashboardContent } from "@/components/dashboard"

export default function DashboardPage() {
	return (
		<Suspense fallback={<p role="status">Carregando sua visão geral…</p>}>
			<DashboardContent />
		</Suspense>
	)
}
