"use client"

import { useEffect, useRef, useState } from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { Button, Card, CardBody, CardHeader, Input } from "@nextui-org/react"
import { Send, Sparkles, X } from "lucide-react"
import { stripThinkingBlocks } from "@/features/ai-chat/text"

const SUGGESTIONS = [
	"Quanto posso gastar por dia?",
	"Como está meu saldo?",
	"O que vence nos próximos 7 dias?",
]

function MessageText({ text }: { text: string }) {
	const visible = stripThinkingBlocks(text)
	if (!visible) return null
	return (
		<p className="whitespace-pre-wrap text-sm leading-relaxed">{visible}</p>
	)
}

export function ChatPanel({ onClose }: { onClose: () => void }) {
	const { messages, sendMessage, status, error } = useChat({
		transport: new DefaultChatTransport({ api: "/api/ai/chat" }),
	})
	const [input, setInput] = useState("")
	const bottomRef = useRef<HTMLDivElement>(null)
	const busy = status === "streaming" || status === "submitted"

	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: "smooth" })
	}, [messages])

	function send(text: string) {
		const value = text.trim()
		if (!value || busy) return
		void sendMessage({ text: value })
		setInput("")
	}

	return (
		<Card className="flex max-h-[62vh] h-[480px] w-[calc(100vw-2rem)] max-w-sm flex-col shadow-2xl">
			<CardHeader className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700">
				<span className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-700 text-white">
					<Sparkles size={16} />
				</span>
				<div className="flex-1">
					<p className="text-sm font-bold text-slate-900 dark:text-white">
						Assistente Vero
					</p>
					<p className="text-[11px] text-slate-500">
						Pergunte sobre seu financeiro
					</p>
				</div>
				<Button
					size="sm"
					variant="light"
					isIconOnly
					aria-label="Fechar chat"
					onPress={onClose}
				>
					<X size={16} />
				</Button>
			</CardHeader>
			<CardBody className="flex flex-1 flex-col gap-2 overflow-y-auto">
				{messages.length === 0 && (
					<div className="flex flex-col gap-2">
						<p className="text-sm text-slate-500">
							Olá! Posso ajudar com saldos, limite diário, próximos lançamentos
							e conciliação.
						</p>
						{SUGGESTIONS.map((suggestion) => (
							<button
								key={suggestion}
								type="button"
								onClick={() => send(suggestion)}
								className="rounded-xl border border-slate-200 px-3 py-2 text-left text-sm text-teal-700 hover:bg-teal-50 dark:border-slate-700 dark:text-teal-300 dark:hover:bg-teal-950"
							>
								{suggestion}
							</button>
						))}
					</div>
				)}
				{messages.map((message) => (
					<div
						key={message.id}
						className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
					>
						<div
							className={`max-w-[85%] rounded-2xl px-3 py-2 ${
								message.role === "user"
									? "bg-teal-700 text-white"
									: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100"
							}`}
						>
							{message.parts.map((part, i) =>
								"text" in part && typeof part.text === "string" ? (
									<MessageText key={i} text={part.text} />
								) : null,
							)}
							{message.parts.some(
								(part) =>
									part.type !== "text" && !part.type.startsWith("data-"),
							) && (
								<p className="mt-1 text-[11px] opacity-70">
									consultando seus dados…
								</p>
							)}
						</div>
					</div>
				))}
				{busy && (
					<p className="text-xs text-slate-400">Vero está escrevendo…</p>
				)}
				{error && (
					<p className="text-xs text-red-500">
						Não foi possível responder. Tente de novo.
					</p>
				)}
				<div ref={bottomRef} />
			</CardBody>
			<div className="flex gap-2 border-t border-slate-200 p-2 dark:border-slate-700">
				<Input
					size="sm"
					aria-label="Mensagem"
					placeholder="Pergunte…"
					value={input}
					onValueChange={setInput}
					onKeyDown={(event) => {
						if (event.key === "Enter") send(input)
					}}
				/>
				<Button
					size="sm"
					color="primary"
					isIconOnly
					aria-label="Enviar"
					isDisabled={!input.trim() || busy}
					onPress={() => send(input)}
				>
					<Send size={15} />
				</Button>
			</div>
		</Card>
	)
}
