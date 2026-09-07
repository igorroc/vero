import { Chip } from "@nextui-org/react"
import Link from "next/link"
import { Calendar, ChevronRight } from "lucide-react"
import type { DashboardData } from "@/features/dashboard"
import { formatCurrency } from "@/types/finance"

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
					{events.slice(0, 4).map((event) => {
						const eventDate = new Date(event.date)
						const isToday =
							eventDate.toDateString() === new Date().toDateString()
						return (
							<div
								key={event.id}
								className={`flex items-center justify-between rounded-xl p-3 ${isToday ? "bg-blue-50 dark:bg-blue-900/20" : "bg-slate-50 dark:bg-slate-800/50"}`}
							>
								<div className="flex min-w-0 items-center gap-3">
									<Chip
										size="sm"
										variant="flat"
										color={
											event.type === "INCOME"
												? "success"
												: event.type === "INVESTMENT"
													? "secondary"
													: "danger"
										}
										className="text-[10px]"
									>
										{event.type === "INCOME" ? "+" : "-"}
									</Chip>
									<div className="min-w-0">
										<p className="truncate text-sm font-medium text-slate-900 dark:text-white">
											{event.description}
										</p>
										<p
											className={`text-xs ${isToday ? "font-medium text-blue-600" : "text-slate-500"}`}
										>
											{isToday
												? "Hoje"
												: eventDate.toLocaleDateString("pt-BR", {
														day: "numeric",
														month: "short",
													})}
										</p>
									</div>
								</div>
								<p
									className={`shrink-0 text-sm font-bold ${event.amount > 0 ? "text-emerald-600" : "text-slate-900 dark:text-white"}`}
								>
									{event.amount > 0 ? "+" : ""}
									{formatCurrency(event.amount)}
								</p>
							</div>
						)
					})}
				</div>
			)}
		</section>
	)
}
