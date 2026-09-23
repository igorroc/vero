"use client"

import { useState } from "react"
import { Button, Select, SelectItem } from "@nextui-org/react"
import { Minus, Plus, X } from "lucide-react"
import { toast } from "react-toastify"
import type { Account } from "@prisma/client"
import type { CategoryWithGroup } from "@/features/categories"
import { formatCurrency } from "@/types/finance"
import {
	confirmEventFromDivergence,
	createEventFromStatement,
	createTransferFromStatement,
} from "@/features/reconciliation"
import { EventCategorySelect } from "@/components/events/event-category-select"
import type { ReviewRow } from "./review-table"

type EventKind = "INCOME" | "EXPENSE"

function formatDateLong(iso: string): string {
	const [year, month, day] = iso.split("-")
	return `${day}/${month}/${year}`
}

export function ReconcileSidebar({
	row,
	accountId,
	accounts,
	categories,
	onClose,
	onResolved,
}: {
	row: ReviewRow
	accountId: string
	accounts: Account[]
	categories: CategoryWithGroup[]
	onClose: () => void
	onResolved: () => void
}) {
	const tx = row.divergence.statementTx
	const [eventKind, setEventKind] = useState<EventKind>(
		row.amountCents < 0 ? "EXPENSE" : "INCOME",
	)
	const [categoryId, setCategoryId] = useState("")
	const [destinationId, setDestinationId] = useState(() => {
		const others = accounts.filter((account) => account.id !== accountId)
		if (row.divergence.transferDirection === "to_investment") {
			return others.find((account) => account.type === "INVESTMENT")?.id ?? ""
		}
		return others[0]?.id ?? ""
	})
	const [busy, setBusy] = useState(false)

	const isTransfer = row.divergence.suggestedAction === "create_transfer"
	const isConfirm = row.divergence.suggestedAction === "confirm_event"
	const isCreate = row.divergence.suggestedAction === "create_event"
	const isOnlyVero = row.status === "only-vero"

	async function handleCreate() {
		if (!tx) return
		setBusy(true)
		const result = await createEventFromStatement({
			accountId,
			categoryId,
			description: tx.description,
			amountCents: tx.amountCents,
			date: tx.date,
			type: eventKind,
		})
		setBusy(false)
		if (!result.success) {
			toast.error(result.error)
			return
		}
		toast.success(result.message)
		onResolved()
	}

	async function handleTransfer() {
		if (!tx) return
		const direction = row.divergence.transferDirection
		const fromAccountId =
			direction === "from_investment" ? destinationId : accountId
		const toAccountId =
			direction === "from_investment" ? accountId : destinationId
		setBusy(true)
		const result = await createTransferFromStatement({
			fromAccountId,
			toAccountId,
			description: tx.description,
			amountCents: tx.amountCents,
			date: tx.date,
		})
		setBusy(false)
		if (!result.success) {
			toast.error(result.error)
			return
		}
		toast.success(result.message)
		onResolved()
	}

	async function handleConfirm() {
		if (!row.divergence.eventId) return
		setBusy(true)
		const result = await confirmEventFromDivergence(row.divergence.eventId)
		setBusy(false)
		if (!result.success) {
			toast.error(result.error)
			return
		}
		toast.success(result.message)
		onResolved()
	}

	return (
		<div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900">
			<div className="flex items-start justify-between gap-2">
				<div>
					<h2 className="text-base font-bold text-slate-900 sm:text-lg dark:text-white">
						Conciliar lançamento
					</h2>
					<p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
						Selecione as informações para conciliar este item com um registro da
						sua conta.
					</p>
				</div>
				<Button
					size="sm"
					variant="light"
					isIconOnly
					aria-label="Fechar"
					onPress={onClose}
				>
					<X size={16} />
				</Button>
			</div>

			<div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
				<p className="text-xs text-slate-500">{formatDateLong(row.dateIso)}</p>
				<div className="mt-1 flex items-start justify-between gap-2">
					<div className="min-w-0">
						<p className="truncate text-sm font-bold uppercase tracking-wide text-slate-900 dark:text-white">
							{row.description}
						</p>
						<p className="text-xs text-slate-500">Lançamento no extrato</p>
					</div>
					<p
						className={`shrink-0 text-base font-bold ${
							row.amountCents >= 0
								? "text-teal-600 dark:text-teal-400"
								: "text-rose-500"
						}`}
					>
						{formatCurrency(row.amountCents)}
					</p>
				</div>
				<p className="mt-2 text-xs text-slate-500">{row.divergence.hint}</p>
			</div>

			{isOnlyVero ? (
				<Button color="primary" onPress={onResolved}>
					Marcar como resolvido
				</Button>
			) : isConfirm ? (
				<Button color="primary" isLoading={busy} onPress={handleConfirm}>
					Confirmar lançamento
				</Button>
			) : isTransfer ? (
				<div className="flex flex-col gap-3">
					<div>
						<p className="mb-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
							{row.divergence.transferDirection === "from_investment"
								? "Conta de origem"
								: "Conta de destino"}
						</p>
						<Select
							aria-label="Conta da transferência"
							size="sm"
							selectedKeys={destinationId ? [destinationId] : []}
							onSelectionChange={(keys) =>
								setDestinationId(String(Array.from(keys)[0] ?? ""))
							}
						>
							{accounts
								.filter((account) => account.id !== accountId)
								.map((account) => (
									<SelectItem key={account.id}>{account.name}</SelectItem>
								))}
						</Select>
					</div>
					<div className="flex gap-2">
						<Button variant="flat" className="flex-1" onPress={onClose}>
							Cancelar
						</Button>
						<Button
							color="primary"
							className="flex-1"
							isLoading={busy}
							isDisabled={!destinationId}
							onPress={handleTransfer}
						>
							Confirmar conciliação
						</Button>
					</div>
				</div>
			) : (
				isCreate && (
					<div className="flex flex-col gap-3">
						<div>
							<p className="mb-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200">
								Tipo de entrada
							</p>
							<div className="grid grid-cols-2 gap-2">
								<button
									type="button"
									onClick={() => setEventKind("EXPENSE")}
									className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors ${
										eventKind === "EXPENSE"
											? "border-teal-600 bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300"
											: "border-slate-200 text-slate-500 dark:border-slate-700"
									}`}
								>
									<span
										className={`flex h-5 w-5 items-center justify-center rounded-full ${
											eventKind === "EXPENSE"
												? "bg-teal-600 text-white"
												: "bg-slate-200 text-slate-500 dark:bg-slate-700"
										}`}
									>
										<Minus size={12} strokeWidth={3} />
									</span>
									Despesa
								</button>
								<button
									type="button"
									onClick={() => setEventKind("INCOME")}
									className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors ${
										eventKind === "INCOME"
											? "border-teal-600 bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300"
											: "border-slate-200 text-slate-500 dark:border-slate-700"
									}`}
								>
									<span
										className={`flex h-5 w-5 items-center justify-center rounded-full ${
											eventKind === "INCOME"
												? "bg-teal-600 text-white"
												: "bg-slate-200 text-slate-500 dark:bg-slate-700"
										}`}
									>
										<Plus size={12} strokeWidth={3} />
									</span>
									Receita
								</button>
							</div>
						</div>
						<div>
							<p className="mb-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
								Categoria
							</p>
							<EventCategorySelect
								categories={categories}
								type={eventKind}
								categoryId={categoryId}
								onSelectionChange={setCategoryId}
							/>
						</div>
						<div className="flex gap-2">
							<Button variant="flat" className="flex-1" onPress={onClose}>
								Cancelar
							</Button>
							<Button
								color="primary"
								className="flex-1"
								isLoading={busy}
								isDisabled={!categoryId}
								onPress={handleCreate}
							>
								Confirmar conciliação
							</Button>
						</div>
					</div>
				)
			)}
		</div>
	)
}
