"use client"

import { useState } from "react"
import {
	ArrowLeft,
	MessageCircle,
	Plus,
	Search,
	Sparkles,
} from "lucide-react"
import { ChatPanel } from "./chat-panel"
import { MOCK_CONVERSATIONS, MOCK_GROUP_ORDER } from "./assistant-mocks"

const NEW_CONVERSATION_KEY = "new"

/**
 * Página do Assistente: lista de conversas + chat em tempo real.
 *
 * Por enquanto as conversas anteriores são MOCKADAS e sem persistência:
 * abrir uma delas monta um chat NOVO do zero (remount pelo `key`) com as
 * mensagens de exemplo no topo, separadas da conversa real. O envio de
 * mensagens usa o fluxo atual (`/api/ai/chat`) normalmente.
 */
export function AssistantPageContent({ userName }: { userName: string }) {
	// "new" = nova conversa vazia; null = nenhuma selecionada (mobile);
	// caso contrário, id de um mock.
	const [selected, setSelected] = useState<string | null>(NEW_CONVERSATION_KEY)
	const [search, setSearch] = useState("")
	const activeMock =
		selected === null
			? undefined
			: MOCK_CONVERSATIONS.find((c) => c.id === selected)

	function openConversation(id: string) {
		setSelected(id)
	}

	const query = search.trim().toLowerCase()
	const filtered = MOCK_CONVERSATIONS.filter(
		(conversation) =>
			query === "" ||
			conversation.title.toLowerCase().includes(query) ||
			conversation.preview.toLowerCase().includes(query),
	)

	const conversationList = (
		<div className="flex h-full flex-col overflow-y-auto">
			<h2 className="px-1 text-base font-bold text-slate-900 dark:text-white">
				Conversas
			</h2>
			<div className="relative mt-2">
				<Search
					size={15}
					className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
				/>
				<input
					aria-label="Buscar nas suas conversas"
					placeholder="Buscar nas suas conversas..."
					value={search}
					onChange={(event) => setSearch(event.target.value)}
					className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none placeholder:text-slate-400 focus:border-teal-500 dark:border-slate-700 dark:bg-slate-900"
				/>
			</div>
			<button
				type="button"
				onClick={() => openConversation(NEW_CONVERSATION_KEY)}
				className="mt-2 flex items-center justify-center gap-1.5 rounded-xl bg-teal-700 px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-800"
			>
				<Plus size={16} strokeWidth={2.5} />
				Nova conversa
			</button>
			{MOCK_GROUP_ORDER.map((group) => {
				const items = filtered.filter((c) => c.group === group)
				if (items.length === 0) return null
				return (
					<div key={group} className="mt-4">
						<p className="px-1 text-[13px] font-bold text-teal-700 dark:text-teal-300">
							{group}
						</p>
						<ul className="mt-1 flex flex-col">
							{items.map((conversation) => {
								const isActive = conversation.id === selected
								return (
									<li key={conversation.id}>
										<button
											type="button"
											onClick={() => openConversation(conversation.id)}
											className={`flex w-full items-start gap-2.5 rounded-xl px-2 py-2.5 text-left transition-colors ${
												isActive
													? "bg-teal-50 dark:bg-teal-950"
													: "hover:bg-slate-50 dark:hover:bg-slate-800/60"
											}`}
										>
											<MessageCircle
												size={18}
												className="mt-0.5 shrink-0 text-slate-500 dark:text-slate-400"
											/>
											<span className="min-w-0 flex-1">
												<span className="block truncate text-sm font-bold text-slate-800 dark:text-slate-100">
													{conversation.title}
												</span>
												<span className="block truncate text-xs text-slate-500">
													{conversation.preview}
												</span>
											</span>
											<span className="shrink-0 text-[11px] text-slate-400">
												{conversation.timeLabel}
											</span>
										</button>
									</li>
								)
							})}
						</ul>
					</div>
				)
			})}
			{filtered.length === 0 && (
				<p className="mt-4 px-1 text-sm text-slate-500">
					Nenhuma conversa encontrada para “{search.trim()}”.
				</p>
			)}
		</div>
	)

	const chat =
		selected === null ? (
			<div className="flex h-full flex-col items-center justify-center gap-2 rounded-2xl border border-slate-100 bg-white p-6 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
				<Sparkles size={24} className="text-teal-700 dark:text-teal-300" />
				<p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
					Selecione uma conversa
				</p>
				<p className="text-xs text-slate-500">
					Escolha uma conversa anterior ou comece uma nova.
				</p>
			</div>
		) : (
			<ChatPanel
				key={selected}
				userName={userName}
				variant="page"
				leadMessages={activeMock?.leadMessages ?? []}
			/>
		)

	return (
		<div className="mx-auto max-w-5xl">
			{/* Desktop: lista lateral + chat (100% da altura, sem scroll da página) */}
			<div className="hidden h-[calc(100dvh-7rem)] md:grid md:grid-cols-[300px_1fr] md:gap-4">
				<aside className="min-h-0 overflow-hidden rounded-2xl border border-slate-100 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
					{conversationList}
				</aside>
				<div className="min-h-0">{chat}</div>
			</div>

			{/* Mobile: lista ou chat, com voltar (100% da altura, sem scroll da página) */}
			<div className="h-[calc(100dvh-10.5rem)] md:hidden">
				{selected === null ? (
					<div className="h-full overflow-y-auto rounded-2xl border border-slate-100 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
						{conversationList}
					</div>
				) : (
					<div className="flex h-full flex-col gap-2">
						<button
							type="button"
							onClick={() => setSelected(null)}
							className="flex w-fit shrink-0 items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
						>
							<ArrowLeft size={14} />
							Conversas
						</button>
						<div className="min-h-0 flex-1">{chat}</div>
					</div>
				)}
			</div>
		</div>
	)
}
