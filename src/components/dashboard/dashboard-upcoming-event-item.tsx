"use client"

import { Chip } from "@nextui-org/react"
import type { DashboardData } from "@/features/dashboard"
import { formatCurrency } from "@/types/finance"

interface DashboardUpcomingEventItemProps {
	event: DashboardData["upcomingEvents"][number]
}

export function DashboardUpcomingEventItem({
	event,
}: DashboardUpcomingEventItemProps) {
	const eventDate = new Date(event.date)
	const isToday = eventDate.toDateString() === new Date().toDateString()

	return (
		<div
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
}
