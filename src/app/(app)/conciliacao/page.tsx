import type { Metadata } from "next"
import { ReconciliationWorkspace } from "@/components/reconciliation"

export const metadata: Metadata = {
	title: "Conciliação | Vero",
	description: "Compare extratos bancários com seus lançamentos.",
}

export default function ConciliacaoPage() {
	return (
		<div className="max-w-3xl mx-auto">
			<div className="mb-4 sm:mb-6">
				<h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
					Conciliação
				</h1>
				<p className="text-sm text-slate-500 mt-1">
					Anexe o extrato (CSV ou OFX) e valide divergências com os lançamentos
				</p>
			</div>
			<ReconciliationWorkspace />
		</div>
	)
}
