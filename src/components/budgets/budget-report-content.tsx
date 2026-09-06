"use client"

import { useEffect, useState } from "react"
import { Input, Spinner } from "@nextui-org/react"
import { getBudgetReport } from "@/features/budgets"
import type { BudgetReport } from "@/lib/engines/budget-report"
import { formatCurrency } from "@/types/finance"
import { toast } from "react-toastify"

export function BudgetReportContent() {
	const now = new Date()
	const [year, setYear] = useState(now.getFullYear())
	const [month, setMonth] = useState(now.getMonth() + 1)
	const [report, setReport] = useState<BudgetReport | null>(null)
	const [loading, setLoading] = useState(true)
	useEffect(() => {
		setLoading(true)
		getBudgetReport(year, month).then((result) => {
			if (result.success) setReport(result.report)
			else toast.error(result.error)
			setLoading(false)
		})
	}, [year, month])
	if (loading) return <div className="flex min-h-64 items-center justify-center"><Spinner label="Carregando relatório..." /></div>
	return <div className="space-y-6">
		<Input type="month" label="Mês do relatório" value={`${year}-${String(month).padStart(2, "0")}`} onValueChange={(value) => { const [nextYear, nextMonth] = value.split("-").map(Number); setYear(nextYear); setMonth(nextMonth) }} className="max-w-xs" />
		{!report ? <div className="modern-card p-8 text-center text-slate-500">Nenhum orçamento criado para este mês.</div> : <>
			<div className="grid gap-4 md:grid-cols-2"><Summary title="Receitas" budgeted={report.income.budgeted} actual={report.income.actual} /><Summary title="Saídas" budgeted={report.outgoing.budgeted} actual={report.outgoing.actual} /></div>
			<section className="modern-card p-4"><h2 className="mb-4 font-semibold">Distribuição das saídas</h2><div className="grid gap-3 sm:grid-cols-3">{(["ESSENTIAL", "LIFESTYLE", "INVESTMENT"] as const).map((type) => <div key={type} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800"><p className="text-sm text-slate-500">{type === "ESSENTIAL" ? "Essencial" : type === "LIFESTYLE" ? "Estilo de vida" : "Investimentos"}</p><p className="mt-1 font-semibold">Orçado: {report.distribution[type].budgeted.toFixed(1)}%</p><p className="text-sm">Realizado: {report.distribution[type].actual.toFixed(1)}%</p></div>)}</div></section>
			{report.groups.map((group) => <section key={`${group.type}-${group.name}`} className="modern-card overflow-hidden"><h2 className="border-b p-4 font-semibold">{group.name}</h2><div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 border-b p-3 text-xs text-slate-500"><span>Categoria</span><span>Orçado</span><span>Realizado</span><span>Diferença</span></div>{group.items.map((item) => <div key={item.categoryId} className="grid grid-cols-[1fr_auto_auto_auto] gap-3 border-b p-3 text-sm last:border-0"><span>{item.categoryName}<small className="ml-2 text-slate-400">{item.executionPercent.toFixed(0)}%</small></span><span>{formatCurrency(item.budgeted)}</span><span>{formatCurrency(item.actual)}</span><span className={item.difference < 0 ? "text-red-600" : "text-emerald-600"}>{formatCurrency(item.difference)}</span></div>)}</section>)}
		</>}
	</div>
}

function Summary({ title, budgeted, actual }: { title: string; budgeted: number; actual: number }) {
	return <div className="modern-card p-4"><p className="text-sm text-slate-500">{title}</p><p className="mt-2 text-lg font-semibold">Orçado: {formatCurrency(budgeted)}</p><p className="text-sm">Realizado: {formatCurrency(actual)}</p></div>
}
