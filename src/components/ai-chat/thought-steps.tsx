"use client"

import { useEffect, useId, useRef, useState } from "react"
import {
	ArrowLeftRight,
	BarChart3,
	Check,
	ChevronDown,
	CircleAlert,
	Database,
	Loader2,
	Sparkles,
	Tags,
	Wallet,
} from "lucide-react"
import {
	getToolName,
	isReasoningUIPart,
	isTextUIPart,
	isToolUIPart,
	type UIDataTypes,
	type UIMessagePart,
	type UITools,
} from "ai"
import { formatThinkingDuration } from "./reasoning"

export type ThoughtStepIcon =
	| "summary"
	| "events"
	| "categories"
	| "divergences"
	| "thinking"
	| "insights"

export type ThoughtStepStatus = "active" | "complete" | "error"

export type ThoughtStep = {
	title: string
	status: ThoughtStepStatus
	icon: ThoughtStepIcon
}

/**
 * Parte de mensagem em formato tolerante: aceita as `UIMessagePart` do SDK e
 * os fixtures estruturais dos testes sem exigir o shape completo.
 */
export type LoosePart = {
	type: string
	state?: string
	toolName?: string
	text?: string
	input?: unknown
}

const TOOL_META: Record<string, { title: string; icon: ThoughtStepIcon }> = {
	get_financial_summary: {
		title: "Consultando resumo financeiro",
		icon: "summary",
	},
	get_events: { title: "Consultando lançamentos", icon: "events" },
	get_categories: { title: "Consultando categorias", icon: "categories" },
	get_budget_report: { title: "Consultando orçamento mensal", icon: "summary" },
	get_spending_by_category: {
		title: "Consultando gastos por categoria",
		icon: "insights",
	},
	find_missing_expenses: {
		title: "Verificando gastos não lançados",
		icon: "insights",
	},
	get_top_expenses: { title: "Consultando maiores gastos", icon: "insights" },
	get_debts_overview: { title: "Consultando dívidas", icon: "summary" },
	compare_months: {
		title: "Comparando com o mês anterior",
		icon: "insights",
	},
	explain_divergences: {
		title: "Analisando divergências",
		icon: "divergences",
	},
}

const DEFAULT_TOOL_META: { title: string; icon: ThoughtStepIcon } = {
	title: "Consultando dados",
	icon: "insights",
}

const MONTH_NAMES = [
	"janeiro",
	"fevereiro",
	"março",
	"abril",
	"maio",
	"junho",
	"julho",
	"agosto",
	"setembro",
	"outubro",
	"novembro",
	"dezembro",
]

function asRecord(value: unknown): Record<string, unknown> | null {
	return value && typeof value === "object"
		? (value as Record<string, unknown>)
		: null
}

function periodLabel(input: Record<string, unknown> | null): string | null {
	if (!input) return null
	const year = input.year
	const month = input.month
	if (
		typeof year === "number" &&
		typeof month === "number" &&
		month >= 1 &&
		month <= 12
	) {
		return `${MONTH_NAMES[month - 1]} de ${year}`
	}
	return null
}

function shortDate(value: unknown): string | null {
	if (typeof value !== "string") return null
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
	return match ? `${match[3]}/${match[2]}` : null
}

/**
 * Descreve a etapa de uma tool com o que está sendo consultado (mês, período,
 * quantidade etc.), para o "thinking" ficar claro.
 */
function describeTool(
	name: string,
	input: unknown,
): { title: string; icon: ThoughtStepIcon } {
	const base = TOOL_META[name]
	const record = asRecord(input)
	const icon = base?.icon ?? DEFAULT_TOOL_META.icon

	switch (name) {
		case "get_budget_report": {
			const period = periodLabel(record)
			return {
				title: period
					? `Consultando orçamento de ${period}`
					: "Consultando orçamento mensal",
				icon,
			}
		}
		case "get_spending_by_category": {
			const period = periodLabel(record)
			return {
				title: period
					? `Consultando gastos de ${period}`
					: "Consultando gastos por categoria",
				icon,
			}
		}
		case "get_events": {
			const start = shortDate(record?.startDate)
			const end = shortDate(record?.endDate)
			const range = start && end ? ` (${start} a ${end})` : ""
			const status = typeof record?.status === "string" ? record.status : null
			const statusLabel =
				status === "PLANNED"
					? " · pendentes"
					: status === "CONFIRMED"
						? " · confirmados"
						: ""
			return {
				title: `${base?.title ?? DEFAULT_TOOL_META.title}${range}${statusLabel}`,
				icon,
			}
		}
		case "explain_divergences": {
			const divergences = record?.divergences
			const count = Array.isArray(divergences) ? divergences.length : null
			return {
				title:
					count != null
						? `Analisando ${count} divergência${count === 1 ? "" : "s"}`
						: "Analisando divergências",
				icon,
			}
		}
		case "find_missing_expenses": {
			const period = periodLabel(record)
			return {
				title: period
					? `Verificando gastos não lançados de ${period}`
					: "Verificando gastos não lançados",
				icon,
			}
		}
		case "get_top_expenses": {
			const period = periodLabel(record)
			return {
				title: period
					? `Consultando maiores gastos de ${period}`
					: "Consultando maiores gastos",
				icon,
			}
		}
		case "compare_months": {
			const period = periodLabel(record)
			return {
				title: period
					? `Comparando ${period} com o mês anterior`
					: "Comparando com o mês anterior",
				icon,
			}
		}
		default:
			return base ?? DEFAULT_TOOL_META
	}
}

function asUiPart(part: LoosePart): UIMessagePart<UIDataTypes, UITools> {
	return part as unknown as UIMessagePart<UIDataTypes, UITools>
}

function toolNameOf(part: LoosePart): string | null {
	const ui = asUiPart(part)
	if (isToolUIPart(ui)) return getToolName(ui)
	return null
}

function stepFor(part: LoosePart): ThoughtStep | null {
	const name = toolNameOf(part)
	if (!name) return null
	return { ...describeTool(name, part.input), status: toolStatus(part.state) }
}

function toolStatus(state?: string): ThoughtStepStatus {
	if (state === "output-available") return "complete"
	if (state === "output-error" || state === "output-denied") return "error"
	return "active"
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
	return step.some((part) => {
		const ui = asUiPart(part)
		return isReasoningUIPart(ui) || isTextUIPart(ui)
	})
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
			out.push({ title: "Pensando…", status: "complete", icon: "thinking" })
		}
		for (const part of step) {
			const described = stepFor(part)
			if (described) out.push({ ...described, status: "complete" })
		}
	}
	return out
}

/**
 * Deriva as etapas de tools do step final. O raciocínio nativo do modelo é
 * tratado à parte (componente `Reasoning`), nunca como etapa.
 */
export function deriveThoughtSteps(parts: LoosePart[]): ThoughtStep[] {
	const steps: ThoughtStep[] = []
	for (const part of parts) {
		const described = stepFor(part)
		if (described) steps.push(described)
	}
	return steps
}

/** Concatena o texto de todas as reasoning parts da mensagem. */
export function reasoningTextOf(parts: LoosePart[]): string {
	return parts
		.filter((part) => isReasoningUIPart(asUiPart(part)))
		.map((part) => part.text ?? "")
		.filter((text) => text.trim().length > 0)
		.join("\n\n")
}

function StepIcon({ icon }: { icon: ThoughtStepIcon }) {
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

function StepStatus({ status }: { status: ThoughtStepStatus }) {
	if (status === "complete")
		return <Check size={13} strokeWidth={3} className="text-teal-600" />
	if (status === "error")
		return <CircleAlert size={13} className="text-red-500" />
	return <Loader2 size={13} className="animate-spin text-teal-600" />
}

export function ThoughtBlock({
	steps,
	duration,
}: {
	steps: ThoughtStep[]
	duration?: number
}) {
	const [open, setOpen] = useState(true)
	const userInteracted = useRef(false)
	const contentId = useId()
	const active = steps.some((step) => step.status === "active")
	const hasError = steps.some((step) => step.status === "error")

	useEffect(() => {
		if (userInteracted.current) return
		setOpen(active)
	}, [active])

	if (steps.length === 0) return null

	const label = active
		? "Pensando…"
		: duration != null
			? `Pensou por ${formatThinkingDuration(duration)}`
			: "Análise concluída"

	return (
		<div className="rounded-xl border border-slate-200 dark:border-slate-700">
			<button
				type="button"
				aria-expanded={open}
				aria-controls={contentId}
				onClick={() => {
					userInteracted.current = true
					setOpen((value) => !value)
				}}
				className="flex w-full items-center gap-2 px-3 py-2 text-left"
			>
				{active ? (
					<Loader2
						size={15}
						className="animate-spin text-teal-700 dark:text-teal-300"
					/>
				) : hasError ? (
					<CircleAlert size={15} className="text-red-500" />
				) : (
					<span className="flex h-4 w-4 items-center justify-center rounded-full bg-teal-600 text-white">
						<Check size={11} strokeWidth={3} />
					</span>
				)}
				<span className="flex-1 text-sm font-bold text-slate-800 dark:text-slate-100">
					{label}
				</span>
				<ChevronDown
					size={14}
					className={`text-slate-400 transition-transform ${open ? "" : "-rotate-90"}`}
				/>
			</button>
			<div
				className={`grid transition-[grid-template-rows] duration-300 ease-out ${
					open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
				}`}
			>
				<div id={contentId} className="overflow-hidden">
					<ul className="flex flex-col gap-1 px-3 pb-2.5">
						{steps.map((step, i) => (
							<li key={i} className="flex items-center gap-2 text-[13px]">
								<StepIcon icon={step.icon} />
								<span className="flex-1 text-slate-600 dark:text-slate-300">
									{step.title}
								</span>
								<StepStatus status={step.status} />
							</li>
						))}
					</ul>
				</div>
			</div>
		</div>
	)
}
