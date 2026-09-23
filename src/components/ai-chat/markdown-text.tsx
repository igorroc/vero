"use client"

import { useMemo } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import {
	Bar,
	BarChart,
	Cell,
	LabelList,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts"

export type ChartData = {
	type: "bar"
	title?: string
	unit?: string | null
	data: Array<{ label: string; value: number }>
}

export function parseChartData(raw: string): ChartData | null {
	try {
		const parsed: unknown = JSON.parse(raw)
		if (typeof parsed !== "object" || parsed === null) return null
		const candidate = parsed as Partial<ChartData>
		if (candidate.type !== "bar" || !Array.isArray(candidate.data)) return null
		const data = candidate.data.filter(
			(item): item is { label: string; value: number } =>
				typeof item?.label === "string" && typeof item?.value === "number",
		)
		if (data.length === 0) return null
		return {
			type: "bar",
			title: typeof candidate.title === "string" ? candidate.title : undefined,
			unit: typeof candidate.unit === "string" ? candidate.unit : undefined,
			data,
		}
	} catch {
		return null
	}
}

function formatValue(value: number, unit?: string | null): string {
	const formatted = value.toLocaleString("pt-BR", { maximumFractionDigits: 0 })
	return unit ? `${unit} ${formatted}` : formatted
}

function ChartBlock({ raw }: { raw: string }) {
	const chart = useMemo(() => parseChartData(raw), [raw])
	if (!chart) {
		return (
			<pre className="overflow-x-auto rounded-lg bg-slate-100 p-3 text-xs dark:bg-slate-800">
				{raw}
			</pre>
		)
	}
	return (
		<div className="my-2 rounded-xl bg-white p-2 dark:bg-slate-900">
			{chart.title && (
				<p className="mb-1 text-sm font-bold text-slate-800 dark:text-slate-100">
					{chart.title}
				</p>
			)}
			<div style={{ height: 200 }}>
				<ResponsiveContainer width="100%" height="100%">
					<BarChart
						data={chart.data}
						margin={{ top: 18, right: 4, left: -18, bottom: 0 }}
					>
						<XAxis dataKey="label" tick={{ fontSize: 11 }} interval={0} />
						<YAxis tick={{ fontSize: 11 }} width={44} />
						<Tooltip
							formatter={(value) => formatValue(Number(value), chart.unit)}
						/>
						<Bar dataKey="value" radius={[6, 6, 0, 0]}>
							{chart.data.map((_, i) => (
								<Cell
									key={i}
									fill={i === chart.data.length - 1 ? "#5FB3A8" : "#0F766E"}
								/>
							))}
							<LabelList
								dataKey="value"
								position="top"
								formatter={(value: unknown) =>
									formatValue(Number(value), chart.unit)
								}
								style={{ fontSize: 11, fontWeight: 700 }}
							/>
						</Bar>
					</BarChart>
				</ResponsiveContainer>
			</div>
		</div>
	)
}

export function MarkdownText({ text }: { text: string }) {
	return (
		<div className="markdown-body text-sm leading-relaxed text-slate-800 dark:text-slate-100">
			<ReactMarkdown
				remarkPlugins={[remarkGfm]}
				components={{
					p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
					strong: ({ children }) => (
						<strong className="font-bold text-slate-900 dark:text-white">
							{children}
						</strong>
					),
					ul: ({ children }) => (
						<ul className="mb-2 list-disc space-y-1 pl-5 last:mb-0">
							{children}
						</ul>
					),
					ol: ({ children }) => (
						<ol className="mb-2 list-decimal space-y-1 pl-5 last:mb-0">
							{children}
						</ol>
					),
					table: ({ children }) => (
						<div className="mb-2 overflow-x-auto">
							<table className="w-full border-collapse text-[13px]">
								{children}
							</table>
						</div>
					),
					th: ({ children }) => (
						<th className="border-b border-slate-300 px-2 py-1 text-left font-bold dark:border-slate-600">
							{children}
						</th>
					),
					td: ({ children }) => (
						<td className="border-b border-slate-100 px-2 py-1 dark:border-slate-800">
							{children}
						</td>
					),
					code: ({ className, children }) => {
						const raw = String(children ?? "")
						if (className?.includes("language-chart")) {
							return <ChartBlock raw={raw} />
						}
						return (
							<code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[13px] dark:bg-slate-800">
								{children}
							</code>
						)
					},
					pre: ({ children }) => <>{children}</>,
				}}
			>
				{text}
			</ReactMarkdown>
		</div>
	)
}
