"use client"

import { useMemo, useState } from "react"
import {
	Button,
	Card,
	CardBody,
	Chip,
	Select,
	SelectItem,
} from "@nextui-org/react"
import { toast } from "react-toastify"
import type { Account } from "@prisma/client"
import type { CategoryWithGroup } from "@/features/categories"
import type {
	Divergence,
	TransferDirection,
} from "@/lib/engines/reconciliation"
import { formatCurrency } from "@/types/finance"
import {
	confirmEventFromDivergence,
	createEventFromStatement,
	createTransferFromStatement,
} from "@/features/reconciliation"
import { EventCategorySelect } from "@/components/events/event-category-select"

type EventKind = "INCOME" | "EXPENSE"

const KIND_LABELS: Record<Divergence["kind"], string> = {
	matched: "Conciliado",
	missing_in_vero: "Só no extrato",
	missing_in_statement: "Só no Vero",
	value_mismatch: "Valor difere",
	transfer_candidate: "Transferência?",
}

const KIND_COLORS: Record<
	Divergence["kind"],
	"success" | "warning" | "danger" | "primary" | "secondary"
> = {
	matched: "success",
	missing_in_vero: "warning",
	missing_in_statement: "danger",
	value_mismatch: "danger",
	transfer_candidate: "primary",
}

function formatDateBR(iso: string): string {
	const [year, month, day] = iso.split("-")
	return `${day}/${month}/${year}`
}

function defaultDestination(
	direction: TransferDirection,
	currentAccountId: string,
	accounts: Account[],
): string {
	const others = accounts.filter((account) => account.id !== currentAccountId)
	if (direction === "to_investment") {
		return others.find((account) => account.type === "INVESTMENT")?.id ?? ""
	}
	if (direction === "from_investment") {
		return (
			accounts.find(
				(account) =>
					account.type === "INVESTMENT" && account.id !== currentAccountId,
			)?.id ?? ""
		)
	}
	return others[0]?.id ?? ""
}

interface DivergenceRowProps {
	divergence: Divergence
	accountId: string
	accounts: Account[]
	categories: CategoryWithGroup[]
	onResolved: () => void
}

export function DivergenceRow({
	divergence,
	accountId,
	accounts,
	categories,
	onResolved,
}: DivergenceRowProps) {
	const tx = divergence.statementTx
	const [eventKind, setEventKind] = useState<EventKind>(
		tx && tx.amountCents < 0 ? "EXPENSE" : "INCOME",
	)
	const [categoryId, setCategoryId] = useState("")
	const [destinationId, setDestinationId] = useState(() =>
		divergence.transferDirection
			? defaultDestination(divergence.transferDirection, accountId, accounts)
			: "",
	)
	const [busy, setBusy] = useState(false)

	const destinationLabel = useMemo(() => {
		if (divergence.transferDirection === "from_investment")
			return "Conta de origem"
		return "Conta de destino"
	}, [divergence.transferDirection])

	async function handleCreateEvent() {
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

	async function handleConfirm() {
		if (!divergence.eventId) return
		setBusy(true)
		const result = await confirmEventFromDivergence(divergence.eventId)
		setBusy(false)
		if (!result.success) {
			toast.error(result.error)
			return
		}
		toast.success(result.message)
		onResolved()
	}

	async function handleCreateTransfer() {
		if (!tx || !divergence.transferDirection) return
		const fromAccountId =
			divergence.transferDirection === "from_investment"
				? destinationId
				: accountId
		const toAccountId =
			divergence.transferDirection === "from_investment"
				? accountId
				: destinationId
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

	return (
		<Card>
			<CardBody className="flex flex-col gap-3">
				<div className="flex items-start justify-between gap-2">
					<div className="min-w-0">
						<p className="font-medium text-slate-900 dark:text-white truncate">
							{tx ? tx.description : "Lançamento sem par no extrato"}
						</p>
						<p className="text-sm text-slate-500">
							{tx ? `${formatDateBR(tx.date)} · ` : ""}
							{tx ? formatCurrency(tx.amountCents) : divergence.hint}
						</p>
					</div>
					<Chip size="sm" color={KIND_COLORS[divergence.kind]} variant="flat">
						{KIND_LABELS[divergence.kind]}
					</Chip>
				</div>

				{divergence.kind !== "matched" && (
					<p className="text-sm text-slate-500">{divergence.hint}</p>
				)}

				{divergence.suggestedAction === "confirm_event" && (
					<div>
						<Button
							size="sm"
							color="primary"
							isLoading={busy}
							onPress={handleConfirm}
						>
							Confirmar lançamento
						</Button>
					</div>
				)}

				{divergence.suggestedAction === "create_event" && tx && (
					<div className="flex flex-col gap-2">
						<div className="flex flex-col sm:flex-row gap-2">
							<Select
								label="Tipo"
								size="sm"
								className="sm:w-40"
								selectedKeys={[eventKind]}
								onSelectionChange={(keys) =>
									setEventKind(
										String(Array.from(keys)[0] ?? "EXPENSE") as EventKind,
									)
								}
							>
								<SelectItem key="INCOME">Receita</SelectItem>
								<SelectItem key="EXPENSE">Despesa</SelectItem>
							</Select>
							<div className="flex-1">
								<EventCategorySelect
									categories={categories}
									type={eventKind}
									categoryId={categoryId}
									onSelectionChange={setCategoryId}
								/>
							</div>
						</div>
						<div>
							<Button
								size="sm"
								color="primary"
								isLoading={busy}
								isDisabled={!categoryId}
								onPress={handleCreateEvent}
							>
								Criar lançamento
							</Button>
						</div>
					</div>
				)}

				{divergence.suggestedAction === "create_transfer" && tx && (
					<div className="flex flex-col gap-2">
						<Select
							label={destinationLabel}
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
						<div>
							<Button
								size="sm"
								color="primary"
								isLoading={busy}
								isDisabled={!destinationId}
								onPress={handleCreateTransfer}
							>
								Criar transferência
							</Button>
						</div>
					</div>
				)}

				{(divergence.kind === "missing_in_statement" ||
					divergence.kind === "value_mismatch") && (
					<div>
						<Button size="sm" variant="light" onPress={onResolved}>
							Marcar como resolvido
						</Button>
					</div>
				)}
			</CardBody>
		</Card>
	)
}
