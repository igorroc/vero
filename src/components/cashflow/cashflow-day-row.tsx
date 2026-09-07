"use client"

import { useState } from "react"
import { Chip } from "@nextui-org/react"
import { ChevronRight } from "lucide-react"
import { formatCurrency, type CashflowDay } from "@/types/finance"

interface CashflowDayRowProps {
	day: CashflowDay
	isToday: boolean
}

export function CashflowDayRow({ day, isToday }: CashflowDayRowProps) {
	const [expanded, setExpanded] = useState(false)
	const stateBackground = day.isNegative
		? "bg-red-50/50 dark:bg-red-900/10"
		: day.isCritical
			? "bg-amber-50/50 dark:bg-amber-900/10"
			: isToday
				? "bg-indigo-50/50 dark:bg-indigo-900/10"
				: ""
	const dateBackground = isToday
		? "bg-indigo-600 text-white"
		: day.isNegative
			? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
			: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"

	return (
		<div className={stateBackground}>
			<div
				className="flex cursor-pointer items-center justify-between p-3 transition-colors hover:bg-slate-50 active:bg-slate-100 dark:hover:bg-slate-800/50 dark:active:bg-slate-800 sm:p-4"
				onClick={() => day.events.length > 0 && setExpanded(!expanded)}
			>
				<div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
					<div
						className={`flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl sm:h-12 sm:w-12 ${dateBackground}`}
					>
						<span className="text-[10px] font-medium uppercase leading-none sm:text-xs">
							{isToday
								? "Hoje"
								: new Date(day.date)
										.toLocaleDateString("pt-BR", { weekday: "short" })
										.replace(".", "")}
						</span>
						<span className="text-sm font-bold leading-tight sm:text-lg">
							{new Date(day.date).getDate()}
						</span>
					</div>
					<div className="min-w-0 flex-1">
						<div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
							<span className="text-xs text-slate-600 dark:text-slate-400 sm:text-sm">
								{day.events.length > 0
									? `${day.events.length} evento${day.events.length > 1 ? "s" : ""}`
									: "Sem eventos"}
							</span>
							{day.isNegative && (
								<Chip
									color="danger"
									size="sm"
									variant="flat"
									className="h-5 text-[10px] sm:text-xs"
								>
									Negativo
								</Chip>
							)}
							{day.isCritical && !day.isNegative && (
								<Chip
									color="warning"
									size="sm"
									variant="flat"
									className="h-5 text-[10px] sm:text-xs"
								>
									Baixo
								</Chip>
							)}
						</div>
						{day.netChange !== 0 && (
							<span
								className={`text-xs font-medium sm:text-sm ${day.netChange > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}
							>
								{day.netChange > 0 ? "+" : ""}
								{formatCurrency(day.netChange)}
							</span>
						)}
					</div>
				</div>
				<div className="flex shrink-0 items-center gap-2 sm:gap-3">
					<div className="text-right">
						<p className="hidden text-[10px] text-slate-500 sm:block sm:text-xs">
							Saldo
						</p>
						<span
							className={`text-sm font-bold sm:text-base ${day.endingBalance < 0 ? "text-red-600 dark:text-red-400" : "text-slate-900 dark:text-white"}`}
						>
							{formatCurrency(day.endingBalance)}
						</span>
					</div>
					{day.events.length > 0 && (
						<ChevronRight
							className={`h-4 w-4 text-slate-400 transition-transform sm:h-5 sm:w-5 ${expanded ? "rotate-90" : ""}`}
						/>
					)}
				</div>
			</div>
			{expanded && day.events.length > 0 && (
				<div className="space-y-2 border-t border-slate-100 bg-slate-50/50 px-3 py-2 dark:border-slate-800 dark:bg-slate-800/30 sm:px-4 sm:py-3">
					{day.events.map((event) => (
						<div
							key={event.id}
							className="flex items-start justify-between gap-2 py-1.5 sm:items-center"
						>
							<div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
								<Chip
									size="sm"
									variant="flat"
									className={`h-5 shrink-0 text-[10px] sm:text-xs ${
										event.type === "INCOME"
											? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
											: event.type === "TRANSFER"
												? "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300"
												: event.type === "INVESTMENT"
													? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
													: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
									}`}
								>
									{event.type === "INCOME"
										? "Receita"
										: event.type === "TRANSFER"
											? "Transferência"
											: event.type === "INVESTMENT"
												? "Invest."
												: "Despesa"}
								</Chip>
								<span className="truncate text-xs text-slate-700 dark:text-slate-300 sm:text-sm">
									{event.description}
									{event.type === "TRANSFER" &&
										event.destinationAccountName &&
										` para ${event.destinationAccountName}`}
								</span>
								{event.status === "PLANNED" && (
									<Chip
										size="sm"
										variant="bordered"
										className="h-5 border-amber-300 text-[10px] text-amber-600 dark:text-amber-400 sm:text-xs"
									>
										Planejado
									</Chip>
								)}
							</div>
							<span
								className={`shrink-0 text-xs font-semibold sm:text-sm ${event.amount > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}
							>
								{event.amount > 0 ? "+" : ""}
								{formatCurrency(event.amount)}
							</span>
						</div>
					))}
				</div>
			)}
		</div>
	)
}
