"use client"

import { useEffect, useState } from "react"
import {
	ArrowLeftRight,
	BarChart3,
	ChevronDown,
	Database,
	Loader2,
	Sparkles,
	Check,
	Tags,
	Wallet,
} from "lucide-react"

export type ThoughtStep = {
	title: string
	done: boolean
	icon:
		| "summary"
		| "events"
		| "categories"
		| "divergences"
		| "thinking"
		| "insights"
}

type LoosePart = {
	type: string
	state?: string
	toolName?: string
}

const TOOL_META: Record<string, { title: string; icon: ThoughtStep["icon"] }> =
	{
		get_financial_summary: {
			title: "Consultando resumo financeiro",
			icon: "summary",
		},
		get_events: { title: "Consultando lançamentos", icon: "events" },
		get_categories: { title: "Consultando categorias", icon: "categories" },
		explain_divergences: {
			title: "Analisando divergências",
			icon: "divergences",
		},
	}

function toolNameOf(part: LoosePart): string | null {
	if (part.type === "dynamic-tool") return part.toolName ?? null
	if (part.type.startsWith("tool-")) return part.type.slice("tool-".length)
	return null
}

/**
 * Divide as parts nos steps do stream (marcador `step-start`).
 * Permite mostrar só títulos dos steps intermediários e o texto do final.
 */
export function splitMessageSteps(parts: LoosePart[]): LoosePart[][] {
	const steps: LoosePart[][] = [[]]
	for (const part of parts) {
		if (part.type === "step-start") {
			steps.push([])
			continue
		}
		steps[steps.length - 1].push(part)
	}
	return steps
}

function hasThinking(step: LoosePart[]): boolean {
	return step.some((part) => part.type === "reasoning" || part.type === "text")
}

/**
 * Etapas dos steps intermediários (já finalizados): texto vira um único
 * "Pensando…" concluído, tools viram seus títulos concluídos.
 */
export function deriveIntermediateSteps(steps: LoosePart[][]): ThoughtStep[] {
	const out: ThoughtStep[] = []
	const intermediates = steps.length > 1 ? steps.slice(0, -1) : []
	for (const step of intermediates) {
		if (hasThinking(step)) {
			out.push({ title: "Pensando…", done: true, icon: "thinking" })
		}
		for (const part of step) {
			const name = toolNameOf(part)
			if (name) {
				const meta = TOOL_META[name] ?? {
					title: "Consultando dados",
					icon: "insights" as const,
				}
				out.push({ title: meta.title, done: true, icon: meta.icon })
			}
		}
	}
	return out
}

/**
 * Deriva etapas legíveis (título + estado) das parts da mensagem.
 * Texto bruto de raciocínio nunca é exibido — só títulos.
 */
export function deriveThoughtSteps(parts: LoosePart[]): ThoughtStep[] {
	const steps: ThoughtStep[] = []
	for (const part of parts) {
		if (part.type === "reasoning") {
			steps.push({
				title: "Pensando…",
				done: part.state === "done",
				icon: "thinking",
			})
			continue
		}
		const name = toolNameOf(part)
		if (name) {
			const meta = TOOL_META[name] ?? {
				title: "Consultando dados",
				icon: "insights" as const,
			}
			steps.push({
				title: meta.title,
				done:
					part.state === "output-available" || part.state === "output-error",
				icon: meta.icon,
			})
		}
	}
	return steps
}

function StepIcon({ icon }: { icon: ThoughtStep["icon"] }) {
	const props = {
		size: 15,
		className: "shrink-0 text-teal-700 dark:text-teal-300",
	}
	switch (icon) {
		case "summary":
			return <Wallet {...props} />
		case "events":
			return <Database {...props} />
		case "categories":
			return <Tags {...props} />
		case "divergences":
			return <ArrowLeftRight {...props} />
		case "thinking":
			return <Sparkles {...props} />
		default:
			return <BarChart3 {...props} />
	}
}

export function ThoughtBlock({
	steps,
	streaming,
}: {
	steps: ThoughtStep[]
	streaming: boolean
}) {
	const [open, setOpen] = useState(true)
	const allDone = steps.every((step) => step.done)
	const finished = !streaming && allDone

	// Fecha sozinho quando a conversa finaliza
	useEffect(() => {
		if (finished) setOpen(false)
	}, [finished])

	if (steps.length === 0) return null

	return (
		<div className="rounded-xl border border-slate-200 dark:border-slate-700">
			<button
				type="button"
				onClick={() => setOpen(!open)}
				className="flex w-full items-center gap-2 px-3 py-2 text-left"
			>
				{streaming || !allDone ? (
					<Loader2
						size={15}
						className="animate-spin text-teal-700 dark:text-teal-300"
					/>
				) : (
					<span className="flex h-4 w-4 items-center justify-center rounded-full bg-teal-600 text-white">
						<Check size={11} strokeWidth={3} />
					</span>
				)}
				<span className="flex-1 text-sm font-bold text-slate-800 dark:text-slate-100">
					{streaming || !allDone ? "Pensando…" : "Análise concluída"}
				</span>
				<ChevronDown
					size={14}
					className={`text-slate-400 transition-transform ${open ? "" : "-rotate-90"}`}
				/>
			</button>
			{open && (
				<ul className="flex flex-col gap-1 px-3 pb-2.5">
					{steps.map((step, i) => (
						<li key={i} className="flex items-center gap-2 text-[13px]">
							<StepIcon icon={step.icon} />
							<span className="flex-1 text-slate-600 dark:text-slate-300">
								{step.title}
							</span>
							{step.done ? (
								<Check size={13} strokeWidth={3} className="text-teal-600" />
							) : (
								<Loader2 size={13} className="animate-spin text-slate-400" />
							)}
						</li>
					))}
				</ul>
			)}
		</div>
	)
}
