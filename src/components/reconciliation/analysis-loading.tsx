"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { BrainCircuit } from "lucide-react"

const MESSAGES = [
	"Lendo o arquivo do extrato…",
	"Identificando lançamentos…",
	"Comparando com seus registros…",
	"Calculando correspondências…",
]

/** Tela da etapa "Análise da IA" (sempre visível por no mínimo 5s). */
export function AnalysisLoading({ fileName }: { fileName: string }) {
	const [messageIndex, setMessageIndex] = useState(0)

	useEffect(() => {
		const interval = setInterval(() => {
			setMessageIndex((current) => (current + 1) % MESSAGES.length)
		}, 1500)
		return () => clearInterval(interval)
	}, [])

	return (
		<div className="flex flex-col items-center rounded-3xl border border-slate-200 bg-white px-6 py-12 text-center sm:py-16 dark:border-slate-800 dark:bg-slate-900">
			<span className="relative flex h-20 w-20 items-center justify-center">
				<span className="absolute inset-0 animate-ping rounded-full bg-teal-200/60 dark:bg-teal-800/40" />
				<span className="relative flex h-20 w-20 items-center justify-center rounded-full bg-teal-700 text-white">
					<BrainCircuit size={36} />
				</span>
			</span>
			<h2 className="mt-6 text-lg font-bold text-slate-900 sm:text-xl dark:text-white">
				Analisando seu extrato…
			</h2>
			<p className="mt-1 max-w-sm text-sm text-slate-500">
				{fileName} · a IA da Vero identifica lançamentos e sugere
				correspondências automaticamente.
			</p>
			<div className="mt-6 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
				<motion.div
					className="h-full rounded-full bg-teal-600"
					initial={{ x: "-100%" }}
					animate={{ x: "200%" }}
					transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
					style={{ width: "40%" }}
				/>
			</div>
			<motion.p
				key={messageIndex}
				initial={{ opacity: 0, y: 4 }}
				animate={{ opacity: 1, y: 0 }}
				className="mt-4 text-sm font-medium text-teal-700 dark:text-teal-300"
			>
				{MESSAGES[messageIndex]}
			</motion.p>
		</div>
	)
}
