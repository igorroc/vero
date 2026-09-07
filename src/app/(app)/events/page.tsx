import type { Metadata } from "next"
import { EventsList } from "@/components/events"

export const metadata: Metadata = {
	title: "Lançamentos | Vero",
	description: "Gerencie seus lançamentos financeiros.",
}

export default function EventsPage() {
	return (
		<div className="max-w-3xl mx-auto">
			{/* Mobile-friendly header */}
			<div className="mb-4 sm:mb-6">
				<h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
					Lançamentos
				</h1>
				<p className="text-sm text-slate-500 mt-1">
					Registre e acompanhe suas movimentações financeiras
				</p>
			</div>
			<EventsList />
		</div>
	)
}
