"use client"

import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Button } from "@nextui-org/react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Plus, Sparkles } from "lucide-react"
import { toast } from "react-toastify"
import { getAccountBalances } from "@/features/accounts"
import { getCategories } from "@/features/categories"
import { EventForm } from "@/components/events/event-form"
import { ChatPanel } from "./chat-panel"

/**
 * Widget global: speed-dial com 2 funções — abrir o modal de novo lançamento
 * e abrir o chat como painel flutuante.
 */
export function AssistantWidget({ userName }: { userName: string }) {
	const [menuOpen, setMenuOpen] = useState(false)
	const [eventOpen, setEventOpen] = useState(false)
	const [chatOpen, setChatOpen] = useState(false)
	const queryClient = useQueryClient()

	const accountsQuery = useQuery({
		queryKey: ["account-balances"],
		queryFn: async () => {
			const result = await getAccountBalances()
			if (!result.success) throw new Error(result.error)
			return result.accounts
		},
		staleTime: 5 * 60 * 1000,
	})
	const categoriesQuery = useQuery({
		queryKey: ["categories"],
		queryFn: async () => {
			const result = await getCategories()
			if (!result.success) throw new Error(result.error)
			return result.categories
		},
		staleTime: 5 * 60 * 1000,
	})
	const accounts = accountsQuery.data ?? []
	const categories = categoriesQuery.data ?? []
	const dataReady = accountsQuery.isSuccess && categoriesQuery.isSuccess

	function handleEventSuccess() {
		toast.success("Lançamento criado")
		setEventOpen(false)
		void queryClient.invalidateQueries({ queryKey: ["events"] })
		void queryClient.invalidateQueries({ queryKey: ["account-balances"] })
		void queryClient.invalidateQueries({ queryKey: ["dashboard-data"] })
	}

	return (
		<>
			<div className="fixed bottom-24 sm:bottom-6 right-4 z-50 flex flex-col items-end gap-2 sm:right-6">
				<AnimatePresence>
					{chatOpen && (
						<motion.div
							key="chat"
							initial={{ opacity: 0, y: 12, scale: 0.97 }}
							animate={{ opacity: 1, y: 0, scale: 1 }}
							exit={{ opacity: 0, y: 12, scale: 0.97 }}
							className="mb-1"
						>
							<ChatPanel
								userName={userName}
								onClose={() => setChatOpen(false)}
							/>
						</motion.div>
					)}
				</AnimatePresence>

				<AnimatePresence>
					{menuOpen && !chatOpen && (
						<motion.div
							key="actions"
							initial={{ opacity: 0, y: 8 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: 8 }}
							className="flex flex-col items-end gap-2"
						>
							<button
								type="button"
								onClick={() => {
									if (!dataReady) {
										toast.error("Carregando dados, tente de novo")
										return
									}
									setMenuOpen(false)
									setEventOpen(true)
								}}
								className="flex items-center gap-2 rounded-full bg-white py-2 pl-3 pr-4 text-sm font-semibold text-slate-800 shadow-lg dark:bg-slate-800 dark:text-slate-100"
							>
								<span className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-700 text-white">
									<Plus size={16} />
								</span>
								Novo lançamento
							</button>
							<button
								type="button"
								onClick={() => {
									setMenuOpen(false)
									setChatOpen(true)
								}}
								className="flex items-center gap-2 rounded-full bg-white py-2 pl-3 pr-4 text-sm font-semibold text-slate-800 shadow-lg dark:bg-slate-800 dark:text-slate-100"
							>
								<span className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-700 text-white">
									<Sparkles size={16} />
								</span>
								Perguntar à IA
							</button>
						</motion.div>
					)}
				</AnimatePresence>

				<Button
					isIconOnly
					aria-label={menuOpen ? "Fechar menu" : "Abrir assistente"}
					color="primary"
					radius="full"
					className="h-14 w-14 min-w-14 shadow-lg"
					onPress={() => {
						setMenuOpen(!menuOpen)
						if (menuOpen) setChatOpen(false)
					}}
				>
					<motion.span animate={{ rotate: menuOpen ? 45 : 0 }} className="flex">
						<Plus className="h-6 w-6" />
					</motion.span>
				</Button>
			</div>

			{eventOpen && dataReady && (
				<EventForm
					isOpen={eventOpen}
					onClose={() => setEventOpen(false)}
					onSuccess={handleEventSuccess}
					accounts={accounts}
					categories={categories}
				/>
			)}
		</>
	)
}
