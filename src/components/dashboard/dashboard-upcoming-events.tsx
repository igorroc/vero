import Link from "next/link"
import { Calendar, ChevronRight } from "lucide-react"
import type { DashboardData } from "@/features/dashboard"
import { DashboardUpcomingEventItem } from "./dashboard-upcoming-event-item"

interface DashboardUpcomingEventsProps {
	events: DashboardData["upcomingEvents"]
}

export function DashboardUpcomingEvents({
	events,
}: DashboardUpcomingEventsProps) {
	return (
		<section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
			<div className="mb-4 flex items-center justify-between">
				<div>
					<h2 className="text-base font-semibold text-slate-900 dark:text-white sm:text-lg">
						Próximos Eventos
					</h2>
					<p className="text-xs text-slate-500 sm:text-sm">Próximos 7 dias</p>
				</div>
				<Link
					href="/events"
					className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
				>
					Ver todos <ChevronRight className="h-4 w-4" />
				</Link>
			</div>
			{events.length === 0 ? (
				<div className="py-6 text-center">
					<div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
						<Calendar className="h-6 w-6 text-slate-400" />
					</div>
					<p className="text-sm text-slate-500">
						Nenhum evento nos próximos 7 dias
					</p>
				</div>
			) : (
				<div className="space-y-2">
					{events.slice(0, 4).map((event) => (
						<DashboardUpcomingEventItem key={event.id} event={event} />
					))}
				</div>
			)}
		</section>
	)
}
