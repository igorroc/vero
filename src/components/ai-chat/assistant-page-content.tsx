"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
	ArrowLeft,
	Check,
	Loader2,
	MessageCircle,
	Pencil,
	Plus,
	Search,
	Trash2,
	X,
} from "lucide-react"
import {
	deleteConversation,
	getConversation,
	listConversations,
	renameConversation,
	type ConversationSummary,
	type PersistedChatMessage,
} from "@/features/ai-chat/conversations"
import { ChatPanel } from "./chat-panel"
import {
	groupConversations,
	timeLabelForDate,
} from "./conversation-groups"

const NEW_CONVERSATION_KEY = "new"

/**
 * Página do Assistente: lista de conversas persistidas + chat em tempo real.
 *
 * Abrir uma conversa monta o chat com o histórico real; "Nova conversa"
 * começa vazia e a conversa é criada no banco no 1º envio. O envio usa o
 * fluxo atual (`/api/ai/chat`) normalmente.
 */
export function AssistantPageContent({ userName }: { userName: string }) {
	// "new" = nova conversa vazia; null = nenhuma selecionada (mobile);
	// caso contrário, id da conversa.
	const [selected, setSelected] = useState<string | null>(NEW_CONVERSATION_KEY)
	const [search, setSearch] = useState("")
	const [conversations, setConversations] = useState<ConversationSummary[]>([])
	const [listLoading, setListLoading] = useState(true)
	const [detail, setDetail] = useState<PersistedChatMessage[]>([])
	const [detailLoading, setDetailLoading] = useState(false)
	const [renamingId, setRenamingId] = useState<string | null>(null)
	const [renameValue, setRenameValue] = useState("")
	const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
	const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

	const refreshList = useCallback(async (query: string) => {
		const result = await listConversations(query.trim() || undefined)
		if (result.success) {
			setConversations(result.conversations)
		}
		setListLoading(false)
	}, [])

	// Busca server-side com debounce; primeira carga imediata.
	useEffect(() => {
		setListLoading(true)
		if (searchTimer.current) clearTimeout(searchTimer.current)
		if (search.trim() === "") {
			void refreshList("")
			return
		}
		searchTimer.current = setTimeout(() => {
			void refreshList(search)
		}, 300)
		return () => {
			if (searchTimer.current) clearTimeout(searchTimer.current)
		}
	}, [search, refreshList])

	// Carrega o histórico ao selecionar uma conversa salva.
	useEffect(() => {
		if (selected === null || selected === NEW_CONVERSATION_KEY) {
			setDetail([])
			setDetailLoading(false)
			return
		}
		setDetailLoading(true)
		let cancelled = false
		void getConversation(selected).then((result) => {
			if (cancelled) return
			setDetail(result.success ? result.conversation.messages : [])
			setDetailLoading(false)
		})
		return () => {
			cancelled = true
		}
	}, [selected])

	function openConversation(id: string) {
		setRenamingId(null)
		setConfirmDeleteId(null)
		setSelected(id)
	}

	async function handleDelete(id: string) {
		if (confirmDeleteId !== id) {
			setConfirmDeleteId(id)
			return
		}
		setConfirmDeleteId(null)
		const result = await deleteConversation(id)
		if (result.success) {
			if (selected === id) setSelected(NEW_CONVERSATION_KEY)
			void refreshList(search)
		}
	}

	async function handleRename(id: string) {
		const result = await renameConversation(id, renameValue)
		if (result.success) {
			setRenamingId(null)
			void refreshList(search)
		}
	}

	const sections = groupConversations(conversations)

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
			{listLoading ? (
				<div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
					<Loader2 size={14} className="animate-spin" />
					Carregando conversas…
				</div>
			) : (
				sections.map(({ group, items }) => (
					<div key={group} className="mt-4">
						<p className="px-1 text-[13px] font-bold text-teal-700 dark:text-teal-300">
							{group}
						</p>
						<ul className="mt-1 flex flex-col">
							{items.map((conversation) => {
								const isActive = conversation.id === selected
								const isRenaming = renamingId === conversation.id
								return (
									<li key={conversation.id} className="group/item">
										{isRenaming ? (
											<div className="flex items-center gap-1 rounded-xl bg-teal-50 px-2 py-2 dark:bg-teal-950">
												<input
													// eslint-disable-next-line jsx-a11y/no-autofocus
													autoFocus
													aria-label="Novo título da conversa"
													value={renameValue}
													maxLength={80}
													onChange={(event) =>
														setRenameValue(event.target.value)
													}
													onKeyDown={(event) => {
														if (event.key === "Enter")
															void handleRename(conversation.id)
														if (event.key === "Escape") setRenamingId(null)
													}}
													className="min-w-0 flex-1 rounded-lg border border-teal-500 bg-white px-2 py-1 text-sm outline-none dark:bg-slate-900"
												/>
												<button
													type="button"
													aria-label="Salvar título"
													onClick={() => void handleRename(conversation.id)}
													className="rounded-lg p-1.5 text-teal-700 hover:bg-teal-100 dark:text-teal-300"
												>
													<Check size={14} />
												</button>
												<button
													type="button"
													aria-label="Cancelar"
													onClick={() => setRenamingId(null)}
													className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800"
												>
													<X size={14} />
												</button>
											</div>
										) : (
											<div
												className={`flex w-full items-start gap-2.5 rounded-xl px-2 py-2.5 transition-colors ${
													isActive
														? "bg-teal-50 dark:bg-teal-950"
														: "hover:bg-slate-50 dark:hover:bg-slate-800/60"
												}`}
											>
												<button
													type="button"
													onClick={() => openConversation(conversation.id)}
													className="flex min-w-0 flex-1 items-start gap-2.5 text-left"
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
															{conversation.preview || "Sem mensagens"}
														</span>
													</span>
													<span className="shrink-0 text-[11px] text-slate-400">
														{timeLabelForDate(
															new Date(conversation.updatedAt),
														)}
													</span>
												</button>
												<span className="flex shrink-0 items-center">
													<button
														type="button"
														aria-label="Renomear conversa"
														onClick={() => {
															setConfirmDeleteId(null)
															setRenameValue(conversation.title)
															setRenamingId(conversation.id)
														}}
														className="rounded-lg p-1.5 text-slate-400 opacity-0 transition-opacity hover:bg-slate-200 hover:text-slate-600 focus:opacity-100 group-hover/item:opacity-100 dark:hover:bg-slate-800"
													>
														<Pencil size={13} />
													</button>
													<button
														type="button"
														aria-label={
															confirmDeleteId === conversation.id
																? "Confirmar exclusão"
																: "Excluir conversa"
														}
														onClick={() => void handleDelete(conversation.id)}
														onBlur={() => {
															if (confirmDeleteId === conversation.id) {
																setConfirmDeleteId(null)
															}
														}}
														className={`rounded-lg p-1.5 transition-colors ${
															confirmDeleteId === conversation.id
																? "bg-red-100 text-red-600 opacity-100 dark:bg-red-950"
																: "text-slate-400 opacity-0 hover:bg-slate-200 hover:text-red-500 focus:opacity-100 group-hover/item:opacity-100 dark:hover:bg-slate-800"
														}`}
													>
														{confirmDeleteId === conversation.id ? (
															<span className="px-1 text-[11px] font-bold">
																Excluir?
															</span>
														) : (
															<Trash2 size={13} />
														)}
													</button>
												</span>
											</div>
										)}
									</li>
								)
							})}
						</ul>
					</div>
				))
			)}
			{!listLoading && conversations.length === 0 && (
				<p className="mt-4 px-1 text-sm text-slate-500">
					{search.trim()
						? `Nenhuma conversa encontrada para “${search.trim()}”.`
						: "Nenhuma conversa ainda. Comece uma nova acima."}
				</p>
			)}
		</div>
	)

	const chat =
		selected === null ? (
			<div className="flex h-full flex-col items-center justify-center gap-2 rounded-2xl border border-slate-100 bg-white p-6 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
				<p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
					Selecione uma conversa
				</p>
				<p className="text-xs text-slate-500">
					Escolha uma conversa anterior ou comece uma nova.
				</p>
			</div>
		) : selected === NEW_CONVERSATION_KEY ? (
			<ChatPanel
				key="new"
				userName={userName}
				variant="page"
				conversationId={null}
				onConversationCreated={() => refreshList(search)}
				onThreadActivity={() => refreshList(search)}
			/>
		) : detailLoading ? (
			<div className="flex h-full items-center justify-center gap-2 rounded-2xl border border-slate-100 bg-white text-xs text-slate-400 shadow-sm dark:border-slate-800 dark:bg-slate-900">
				<Loader2 size={15} className="animate-spin" />
				Carregando conversa…
			</div>
		) : (
			<ChatPanel
				key={selected}
				userName={userName}
				variant="page"
				conversationId={selected}
				initialMessages={detail}
				onThreadActivity={() => refreshList(search)}
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
