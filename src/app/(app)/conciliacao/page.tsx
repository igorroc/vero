import type { Metadata } from "next"
import { ReconciliationWorkspace } from "@/components/reconciliation"

export const metadata: Metadata = {
	title: "Conciliação | Vero",
	description: "Compare extratos bancários com seus lançamentos.",
}

export default function ConciliacaoPage() {
	return (
		<div className="mx-auto max-w-6xl">
			<div className="mb-4 sm:mb-6">
				<h1 className="text-2xl font-bold text-slate-900 sm:text-3xl dark:text-white">
					Conciliação de extrato
				</h1>
				<p className="mt-1 text-sm text-slate-500 sm:text-base">
					Importe seu extrato bancário e conte com a IA da Vero para conciliar
					seus lançamentos de forma rápida e segura.
				</p>
			</div>
			<ReconciliationWorkspace />
		</div>
	)
}
