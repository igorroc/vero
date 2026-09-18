"use client"

import {
	CartesianGrid,
	Line,
	LineChart,
	ReferenceLine,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts"
import type { DashboardData } from "@/features/dashboard"
import { formatCurrency, type Cents } from "@/types/finance"

interface DashboardBalanceChartProps {
	series: DashboardData["monthlyBalanceSeries"]
	safetyBuffer: Cents
}

function formatDay(dateKey: string) {
	const [, month, day] = dateKey.split("-")
	return `${day}/${month}`
}

function getCents(value: unknown): Cents {
	return typeof value === "number" ? value : 0
}

export function DashboardBalanceChart({
	series,
	safetyBuffer,
}: DashboardBalanceChartProps) {
	return (
		<section className="modern-card p-4 sm:p-5">
			<div className="flex flex-wrap items-end justify-between gap-3">
				<div>
					<h2 className="text-base font-semibold text-text-primary sm:text-lg">
						Saldo ao longo do mês
					</h2>
					<p className="mt-0.5 text-sm text-text-secondary">
						Trechos pontilhados consideram os lançamentos planejados.
					</p>
				</div>
				<div
					className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-text-secondary"
					aria-label="Legenda do gráfico"
				>
					<span className="flex items-center gap-1.5">
						<i className="h-0.5 w-4 bg-primary" />
						Saldo em conta
					</span>
					<span className="flex items-center gap-1.5">
						<i className="h-0.5 w-4 bg-info" />
						Investimentos
					</span>
					<span className="flex items-center gap-1.5">
						<i className="h-0 w-4 border-t-2 border-dashed border-text-muted" />
						Planejado
					</span>
				</div>
			</div>
			<div className="mt-4 h-60 sm:h-72">
				<ResponsiveContainer width="100%" height="100%">
					<LineChart
						data={series}
						margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
					>
						<CartesianGrid
							stroke="rgb(var(--color-border))"
							strokeDasharray="3 3"
							vertical={false}
						/>
						<XAxis
							dataKey="dateKey"
							tickFormatter={formatDay}
							interval="preserveStartEnd"
							tick={{ fill: "rgb(var(--color-text-muted))", fontSize: 12 }}
							axisLine={false}
							tickLine={false}
						/>
						<YAxis
							width={64}
							tickFormatter={(value: number) =>
								formatCurrency(value).replace(",00", "")
							}
							tick={{ fill: "rgb(var(--color-text-muted))", fontSize: 12 }}
							axisLine={false}
							tickLine={false}
						/>
						<Tooltip
							content={({ active, payload, label }) => {
								if (!active || !payload?.length || typeof label !== "string")
									return null
								return (
									<div className="rounded-xl border border-border bg-surface px-3 py-2 text-sm shadow-surface">
										<p className="font-medium text-text-primary">
											Dia {formatDay(label)}
										</p>
										{payload.map((entry) => (
											<p
												key={String(entry.dataKey)}
												className="text-text-secondary"
											>
												{entry.name}: {formatCurrency(getCents(entry.value))}
											</p>
										))}
									</div>
								)
							}}
						/>
						<ReferenceLine
							y={0}
							stroke="rgb(var(--color-danger))"
							strokeDasharray="3 3"
						/>
						{safetyBuffer > 0 && (
							<ReferenceLine
								y={safetyBuffer}
								stroke="rgb(var(--color-warning))"
								strokeDasharray="3 3"
							/>
						)}
						<Line
							type="monotone"
							dataKey="realAvailableBalance"
							name="Saldo em conta"
							stroke="rgb(var(--color-primary))"
							strokeWidth={3}
							dot={false}
							connectNulls={false}
							isAnimationActive={false}
						/>
						<Line
							type="monotone"
							dataKey="projectedAvailableBalance"
							name="Saldo em conta planejado"
							stroke="rgb(var(--color-primary))"
							strokeWidth={3}
							strokeDasharray="7 7"
							dot={false}
							connectNulls={false}
							isAnimationActive={false}
						/>
						<Line
							type="monotone"
							dataKey="realInvestmentBalance"
							name="Investimentos"
							stroke="rgb(var(--color-info))"
							strokeWidth={3}
							dot={false}
							connectNulls={false}
							isAnimationActive={false}
						/>
						<Line
							type="monotone"
							dataKey="projectedInvestmentBalance"
							name="Investimentos planejados"
							stroke="rgb(var(--color-info))"
							strokeWidth={3}
							strokeDasharray="7 7"
							dot={false}
							connectNulls={false}
							isAnimationActive={false}
						/>
					</LineChart>
				</ResponsiveContainer>
			</div>
		</section>
	)
}
