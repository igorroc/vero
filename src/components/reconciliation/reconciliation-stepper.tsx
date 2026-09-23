"use client"

import { Check } from "lucide-react"

export type ReconciliationStep = "import" | "analyzing" | "review"

const STEPS: Array<{
	key: ReconciliationStep
	title: string
	description: string
	doneDescription: string
}> = [
	{
		key: "import",
		title: "Importar extrato",
		description: "Selecione a conta e envie seu arquivo",
		doneDescription: "Arquivo processado com sucesso.",
	},
	{
		key: "analyzing",
		title: "Análise da IA",
		description: "A Vero analisa o arquivo e encontra as correspondências",
		doneDescription: "A IA analisou as movimentações do seu extrato.",
	},
	{
		key: "review",
		title: "Revisar correspondências",
		description: "Você confere os resultados e valida as movimentações",
		doneDescription:
			"Você confere os resultados e concilia os itens pendentes.",
	},
]

function stepIndex(current: ReconciliationStep): number {
	return STEPS.findIndex((step) => step.key === current)
}

function circleClass(done: boolean, isActive: boolean): string {
	const base =
		"mx-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors"
	if (done || isActive) return `${base} bg-primary text-white`
	return `${base} border border-slate-300 text-slate-400 dark:border-slate-600`
}

export function ReconciliationStepper({
	current,
}: {
	current: ReconciliationStep
}) {
	const active = stepIndex(current)
	return (
		<ol className="flex items-start justify-between gap-2 sm:gap-4">
			{STEPS.map((step, index) => {
				const done = index < active
				const isActive = index === active
				const highlighted = done || isActive
				return (
					<li
						key={step.key}
						className="flex flex-1 flex-col items-center text-center"
					>
						<span className={circleClass(done, isActive)}>
							{done ? <Check size={16} strokeWidth={3} /> : index + 1}
						</span>
						<p
							className={`mt-2 text-xs font-bold sm:text-sm ${highlighted ? "text-slate-900 dark:text-white" : "text-slate-400"}`}
						>
							{step.title}
						</p>
						<p className="mt-0.5 hidden text-[11px] leading-tight text-slate-500 sm:block">
							{done ? step.doneDescription : step.description}
						</p>
					</li>
				)
			})}
		</ol>
	)
}
