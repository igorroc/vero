"use client"

import { useEffect, useRef, useState } from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { Button, Card, CardBody } from "@nextui-org/react"
import {
	BarChart3,
	Check,
	Loader2,
	Minus,
	PiggyBank,
	Send,
	ShieldCheck,
	UtensilsCrossed,
	X,
} from "lucide-react"
import { sanitizeAssistantReply } from "@/features/ai-chat/text"
import { MarkdownText } from "./markdown-text"
import {
	deriveIntermediateSteps,
	deriveThoughtSteps,
	splitMessageSteps,
	ThoughtBlock,
} from "./thought-steps"

const SUGGESTIONS = [
	{ label: "Posso gastar hoje?", icon: UtensilsCrossed },
	{ label: "Como está meu caixa?", icon: PiggyBank },
	{ label: "Últimos lançamentos", icon: BarChart3 },
]

function sentTimeKey(id: string): string {
	return `sent-${id}`
}

export function ChatPanel({
	userName,
	onClose,
}: {
	userName: string
	onClose: () => void
}) {
	const { messages, sendMessage, status, error } = useChat({
		transport: new DefaultChatTransport({ api: "/api/ai/chat" }),
	})
	const [input, setInput] = useState("")
	const [collapsed, setCollapsed] = useState(false)
	// Timestamps sem estado: a chegada de mensagens já re-renderiza, então um
	// ref basta — e nenhum setState em effect pode entrar em loop.
	const sentAtRef = useRef<Record<string, string>>({})
	const bottomRef = useRef<HTMLDivElement>(null)
	const busy = status === "streaming" || status === "submitted"

	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: "smooth" })
	}, [messages, busy])

	function sentTime(id: string): string {
		const key = sentTimeKey(id)
		let value = sentAtRef.current[key]
		if (!value) {
			value = new Date().toLocaleTimeString("pt-BR", {
				hour: "2-digit",
				minute: "2-digit",
			})
			sentAtRef.current[key] = value
		}
		return value
	}

	function send(text: string) {
		const value = text.trim()
		if (!value || busy) return
		void sendMessage({ text: value })
		setInput("")
	}

	const firstName = userName.trim().split(" ")[0] || "você"
	// O Gemini pode demorar vários segundos até o primeiro chunk do stream
	// (status "submitted" sem mensagem da assistente ainda). Mostra uma bolha
	// provisória para o usuário ter feedback imediato após enviar.
	const awaitingFirstChunk =
		busy &&
		messages.length > 0 &&
		messages[messages.length - 1]?.role === "user"

	return (
		<Card className="flex max-h-[70vh] h-[560px] w-[calc(100vw-2rem)] max-w-md flex-col overflow-hidden shadow-2xl">
			<div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-700">
				<span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300">
					<span className="text-lg font-black">V</span>
				</span>
				<div className="min-w-0 flex-1">
					<div className="flex items-center gap-2">
						<p className="truncate text-base font-bold text-slate-900 dark:text-white">
							Pergunte à Vero
						</p>
					</div>
					<p className="text-[11px] text-slate-400">Gerado pela IA</p>
				</div>
				<Button
					size="sm"
					variant="light"
					isIconOnly
					aria-label="Minimizar"
					onPress={() => setCollapsed(!collapsed)}
				>
					<Minus size={16} />
				</Button>
				<Button
					size="sm"
					variant="light"
					isIconOnly
					aria-label="Fechar chat"
					onPress={onClose}
				>
					<X size={16} />
				</Button>
			</div>

			{!collapsed && (
				<>
					<CardBody className="flex flex-1 flex-col gap-3 overflow-y-auto px-3 sm:px-4">
						{messages.length === 0 && (
							<>
								<div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60">
									<p className="text-[15px] font-semibold leading-snug text-slate-800 dark:text-slate-100">
										Olá, {firstName}. Posso te ajudar a entender seus gastos e
										planejar seus próximos passos.
									</p>
									<div className="mt-3 grid grid-cols-3 gap-2">
										{SUGGESTIONS.map(({ label, icon: Icon }) => (
											<button
												key={label}
												type="button"
												onClick={() => send(label)}
												className="flex flex-col items-start gap-1.5 rounded-xl border border-slate-200 bg-white p-2.5 text-left text-xs font-medium text-slate-700 hover:border-teal-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
											>
												<Icon
													size={16}
													className="text-teal-700 dark:text-teal-300"
												/>
												{label}
											</button>
										))}
									</div>
								</div>
							</>
						)}

						{messages.map((message) => {
							if (message.role === "user") {
								const text = message.parts
									.filter(
										(part): part is { type: "text"; text: string } =>
											"text" in part && typeof part.text === "string",
									)
									.map((part) => part.text)
									.join("")
								return (
									<div key={message.id} className="flex justify-end">
										<div className="max-w-[85%]">
											<div className="rounded-2xl rounded-br-md bg-teal-700 px-3.5 py-2.5 text-sm text-white">
												{text}
											</div>
											<p className="mt-0.5 flex items-center justify-end gap-1 text-[11px] text-slate-400">
												{sentTime(message.id)}
												<Check size={12} strokeWidth={3} />
											</p>
										</div>
									</div>
								)
							}

							const looseParts = message.parts.map((part) => ({
								type: part.type,
								state: "state" in part ? String(part.state ?? "") : "",
								toolName:
									"toolName" in part && typeof part.toolName === "string"
										? part.toolName
										: undefined,
							}))
							const split = splitMessageSteps(looseParts)
							const finalStep = split[split.length - 1] ?? []
							// Títulos: steps intermediários + tools do step final.
							// Texto: SOMENTE do step final (pensamento não renderiza).
							const steps = [
								...deriveIntermediateSteps(split),
								...deriveThoughtSteps(finalStep),
							]
							const textBuckets: string[][] = [[]]
							message.parts.forEach((part) => {
								if (part.type === "step-start") {
									textBuckets.push([])
									return
								}
								if ("text" in part && typeof part.text === "string") {
									textBuckets[textBuckets.length - 1].push(part.text)
								}
							})
					const texts = (textBuckets[textBuckets.length - 1] ?? [])
						.map((text) => sanitizeAssistantReply(text))
						.filter(Boolean)
							const isStreaming =
								busy && messages[messages.length - 1]?.id === message.id

							return (
								<div key={message.id} className="flex gap-2">
									<span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-50 text-sm font-black text-teal-700 dark:bg-teal-950 dark:text-teal-300">
										V
									</span>
									<div className="flex min-w-0 flex-1 flex-col gap-2 rounded-2xl rounded-tl-md border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
										{steps.length > 0 && (
											<ThoughtBlock steps={steps} streaming={isStreaming} />
										)}
									{texts.map((text, i) => (
										<MarkdownText key={i} text={text} />
									))}
									{!isStreaming && texts.length === 0 && (
										<p className="text-xs text-slate-500">
											Não consegui formular a resposta. Tente reformular a
											pergunta.
										</p>
									)}
										{isStreaming && texts.length === 0 && (
											<p className="text-xs text-slate-400">
												Vero está escrevendo…
											</p>
										)}
										<p className="text-right text-[11px] text-slate-400">
											{sentTime(message.id)}
										</p>
									</div>
								</div>
							)
						})}

						{awaitingFirstChunk && (
							<div className="flex gap-2" aria-live="polite">
								<span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-50 text-sm font-black text-teal-700 dark:bg-teal-950 dark:text-teal-300">
									V
								</span>
								<div className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl rounded-tl-md border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
									<Loader2
										size={15}
										className="animate-spin text-teal-700 dark:text-teal-300"
									/>
									<p className="text-xs text-slate-500">
										Vero está pensando…
									</p>
								</div>
							</div>
						)}

						{error && (
							<p className="text-xs text-red-500">
								Não foi possível responder. Tente de novo.
							</p>
						)}
						<div ref={bottomRef} />
					</CardBody>

					<div className="border-t border-slate-200 px-3 pb-2 pt-2.5 dark:border-slate-700 sm:px-4">
						<div className="flex items-center gap-2 rounded-full border border-slate-200 py-1.5 pl-4 pr-1.5 dark:border-slate-700">
							<input
								aria-label="Mensagem"
								placeholder="Pergunte sobre seus gastos, orçamento ou planos…"
								value={input}
								onChange={(event) => setInput(event.target.value)}
								onKeyDown={(event) => {
									if (event.key === "Enter") send(input)
								}}
								className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
							/>
							<button
								type="button"
								aria-label={busy ? "Enviando" : "Enviar"}
								disabled={!input.trim() || busy}
								onClick={() => send(input)}
								className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-700 text-white transition-opacity disabled:opacity-40"
							>
								{busy ? (
									<Loader2 size={16} className="animate-spin" />
								) : (
									<Send size={16} />
								)}
							</button>
						</div>
						<p className="mt-1.5 flex items-center justify-center gap-1 text-center text-[11px] text-slate-400">
							<ShieldCheck size={12} />
							Suas informações estão seguras e são usadas apenas para te ajudar.
						</p>
					</div>
				</>
			)}
		</Card>
	)
}
