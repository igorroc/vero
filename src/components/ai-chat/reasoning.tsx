"use client"

import { memo, useEffect, useId, useRef, useState } from "react"
import { Check, ChevronDown, Loader2 } from "lucide-react"

export function formatThinkingDuration(seconds: number): string {
	const value = Math.max(1, Math.round(seconds))
	if (value < 60) return `${value}s`
	const minutes = Math.floor(value / 60)
	const remainder = value % 60
	return remainder > 0 ? `${minutes}min ${remainder}s` : `${minutes}min`
}

export const Reasoning = memo(function Reasoning({
	text,
	isStreaming,
	duration,
	defaultOpen = true,
}: {
	text: string
	isStreaming: boolean
	duration?: number
	defaultOpen?: boolean
}) {
	const [open, setOpen] = useState(defaultOpen)
	const userInteracted = useRef(false)
	const contentId = useId()

	useEffect(() => {
		if (userInteracted.current) return
		setOpen(isStreaming)
	}, [isStreaming])

	if (!text.trim()) return null

	const label = isStreaming
		? "Pensando…"
		: duration != null
			? `Pensou por ${formatThinkingDuration(duration)}`
			: "Raciocínio concluído"

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
				{isStreaming ? (
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
					<p className="whitespace-pre-wrap px-3 pb-2.5 text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">
						{text}
					</p>
				</div>
			</div>
		</div>
	)
})
