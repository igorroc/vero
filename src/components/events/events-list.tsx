"use client"

import { Fragment, useEffect, useState } from "react"
import {
	Button,
	Dropdown,
	DropdownItem,
	DropdownMenu,
	DropdownTrigger,
	Spinner,
	useDisclosure,
} from "@nextui-org/react"
import {
	confirmEvent,
	deleteEvent,
	getEvents,
	skipEvent,
	updateEvent,
	updateTransfer,
	type UpdateEventInput,
} from "@/features/events"
import {
	getAccountBalances,
	type AccountWithBalance,
} from "@/features/accounts"
import { getCategories, type CategoryWithGroup } from "@/features/categories"
import {
	centsToDollars,
	dateFromInput,
	formatCurrency,
	formatDateInput,
} from "@/types/finance"
import type { Event } from "@prisma/client"
import { toast } from "react-toastify"
import { Calendar, ChevronDown, Plus } from "lucide-react"
import { useEventsFilterStore } from "@/stores/events-filter-store"
import {
	EventEditModal,
	type EditEventData,
	type TransferEditData,
} from "./event-edit-modal"
import { EventForm } from "./event-form"
import { EventListItem } from "./event-list-item"

export function EventsList() {
	const [events, setEvents] = useState<Event[]>([])
	const [accounts, setAccounts] = useState<AccountWithBalance[]>([])
	const [categories, setCategories] = useState<CategoryWithGroup[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const statusFilter = useEventsFilterStore((state) => state.statusFilter)
	const setStatusFilter = useEventsFilterStore((state) => state.setStatusFilter)
	const { isOpen, onOpen, onClose } = useDisclosure()
	const {
		isOpen: isEditOpen,
		onOpen: onEditOpen,
		onClose: onEditClose,
	} = useDisclosure()
	const {
		isOpen: isTransferEditOpen,
		onOpen: onTransferEditOpen,
		onClose: onTransferEditClose,
	} = useDisclosure()
	const [editLoading, setEditLoading] = useState(false)
	const [editData, setEditData] = useState<EditEventData | null>(null)
	const [transferEditData, setTransferEditData] =
		useState<TransferEditData | null>(null)

	useEffect(() => {
		loadData()
	}, [statusFilter])

	const loadData = async () => {
		setLoading(true)
		setError(null)
		const accountsResult = await getAccountBalances()
		if (accountsResult.success) setAccounts(accountsResult.accounts)
		const categoriesResult = await getCategories()
		if (categoriesResult.success) setCategories(categoriesResult.categories)
		const result = await getEvents(
			statusFilter === "pending"
				? { status: "PLANNED" }
				: statusFilter === "confirmed"
					? { status: "CONFIRMED" }
					: {},
		)
		if (result.success) {
			setEvents(
				[...result.events].sort((a, b) => {
					const aDay = new Date(a.date).setHours(0, 0, 0, 0)
					const bDay = new Date(b.date).setHours(0, 0, 0, 0)
					if (aDay !== bDay) return bDay - aDay
					const aIsIncome = a.amount > 0
					const bIsIncome = b.amount > 0
					if (aIsIncome !== bIsIncome) return aIsIncome ? 1 : -1
					return new Date(b.date).getTime() - new Date(a.date).getTime()
				}),
			)
		} else setError(result.error)
		setLoading(false)
	}

	const handleConfirm = async (eventId: string) => {
		const result = await confirmEvent(eventId)
		if (result.success) {
			toast.success("Evento confirmado")
			loadData()
		} else toast.error(result.error)
	}
	const handleSkip = async (eventId: string) => {
		const result = await skipEvent(eventId)
		if (result.success) {
			toast.success("Evento ignorado")
			loadData()
		} else toast.error(result.error)
	}
	const handleDelete = async (eventId: string) => {
		if (!confirm("Tem certeza que deseja excluir este evento?")) return
		const result = await deleteEvent(eventId)
		if (result.success) {
			toast.success("Evento excluído")
			loadData()
		} else toast.error(result.error)
	}
	const handleEdit = (event: Event) => {
		if (event.type === "TRANSFER") {
			setTransferEditData({
				id: event.id,
				description: event.description,
				amount: centsToDollars(Math.abs(event.amount)).toString(),
				date: formatDateInput(new Date(event.date)),
			})
			onTransferEditOpen()
			return
		}
		const isGenerated = event.id.startsWith("generated-")
		const templateId = isGenerated
			? event.id.split("-").slice(1, -1).join("-")
			: undefined
		setEditData({
			id: templateId ?? event.id,
			accountId: event.accountId,
			categoryId: event.categoryId || "",
			description: event.description,
			amount: centsToDollars(Math.abs(event.amount)).toString(),
			type: event.type as EditEventData["type"],
			costType: (event.costType as EditEventData["costType"]) || "RECURRENT",
			date: formatDateInput(new Date(event.date)),
			isGenerated,
			templateId,
		})
		onEditOpen()
	}
	const handleUpdate = async () => {
		if (!editData) return
		if (!editData.description) {
			toast.error("Descrição é obrigatória")
			return
		}
		if (!editData.categoryId) {
			toast.error("Categoria é obrigatória")
			return
		}
		setEditLoading(true)
		const input: UpdateEventInput = {
			id: editData.id,
			accountId: editData.accountId,
			categoryId: editData.categoryId,
			description: editData.description,
			amount: parseFloat(editData.amount),
			type: editData.type,
			costType: editData.type === "EXPENSE" ? editData.costType : undefined,
			date: dateFromInput(editData.date),
		}
		const result = await updateEvent(input)
		if (result.success) {
			toast.success(
				editData.isGenerated
					? "Modelo recorrente atualizado"
					: "Evento atualizado",
			)
			loadData()
			onEditClose()
			setEditData(null)
		} else toast.error(result.error)
		setEditLoading(false)
	}
	const handleTransferUpdate = async () => {
		if (!transferEditData) return
		setEditLoading(true)
		const result = await updateTransfer({
			id: transferEditData.id,
			description: transferEditData.description,
			amount: parseFloat(transferEditData.amount),
			date: dateFromInput(transferEditData.date),
		})
		if (result.success) {
			toast.success("Transferência atualizada")
			await loadData()
			onTransferEditClose()
			setTransferEditData(null)
		} else toast.error(result.error)
		setEditLoading(false)
	}

	if (loading)
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<Spinner size="lg" label="Carregando eventos..." />
			</div>
		)
	const budgetSummary = calculateBudgetSummary(events)
	const currentMonth = new Date().toLocaleDateString("pt-BR", { month: "long" })

	return (
		<div className="space-y-4 sm:space-y-6">
			{events.length > 0 && (
				<div className="bg-gradient-to-r from-indigo-900 to-indigo-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-white relative overflow-hidden">
					<div className="absolute top-4 right-4 w-16 h-16 sm:w-20 sm:h-20 bg-pink-500/20 rounded-full blur-xl" />
					<div className="absolute bottom-4 right-12 w-10 h-10 sm:w-12 sm:h-12 bg-teal-500/30 rounded-full blur-lg" />
					<div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 relative z-10">
						<div className="space-y-1">
							<p className="text-indigo-200 text-sm font-medium capitalize">
								Orçamento de {currentMonth}
							</p>
							<p className="text-2xl sm:text-3xl font-bold">
								{formatCurrency(budgetSummary.totalExpenses)}
							</p>
						</div>
						<div className="text-right hidden sm:block">
							<p className="text-indigo-200 text-sm">Receitas</p>
							<p className="text-lg font-semibold text-emerald-400">
								+{formatCurrency(budgetSummary.totalIncome)}
							</p>
						</div>
					</div>
					<div className="mt-4 space-y-2 relative z-10">
						<div className="flex justify-between text-xs sm:text-sm text-indigo-200">
							<span>Confirmado</span>
							<span>{Math.round(budgetSummary.progress)}%</span>
						</div>
						<div className="h-1.5 sm:h-2 bg-white/20 rounded-full overflow-hidden">
							<div
								className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500"
								style={{ width: `${budgetSummary.progress}%` }}
							/>
						</div>
					</div>
					<div className="mt-3 sm:hidden flex justify-between text-sm">
						<span className="text-indigo-200">Receitas esperadas</span>
						<span className="text-emerald-400 font-medium">
							+{formatCurrency(budgetSummary.totalIncome)}
						</span>
					</div>
				</div>
			)}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
				<div className="w-full sm:hidden">
					<Dropdown>
						<DropdownTrigger>
							<Button
								variant="flat"
								className="w-full justify-between"
								endContent={<ChevronDown className="w-4 h-4" />}
							>
								{statusFilter === "all" && "Todos os lançamentos"}
								{statusFilter === "pending" && "Lançamentos pendentes"}
								{statusFilter === "confirmed" && "Lançamentos confirmados"}
							</Button>
						</DropdownTrigger>
						<DropdownMenu
							aria-label="Filtro de tempo"
							selectionMode="single"
							selectedKeys={[statusFilter]}
							onSelectionChange={(keys) =>
								setStatusFilter(Array.from(keys)[0] as typeof statusFilter)
							}
						>
							<DropdownItem key="all">Todos os lançamentos</DropdownItem>
							<DropdownItem key="pending">Pendentes</DropdownItem>
							<DropdownItem key="confirmed">Confirmados</DropdownItem>
						</DropdownMenu>
					</Dropdown>
				</div>
				<div className="hidden sm:flex gap-2 flex-wrap">
					{[
						{ key: "all", label: "Todos" },
						{ key: "pending", label: "Pendentes" },
						{ key: "confirmed", label: "Confirmados" },
					].map((filter) => (
						<Button
							key={filter.key}
							size="sm"
							radius="full"
							color={statusFilter === filter.key ? "primary" : "default"}
							variant={statusFilter === filter.key ? "solid" : "flat"}
							onPress={() => setStatusFilter(filter.key as typeof statusFilter)}
						>
							{filter.label}
						</Button>
					))}
				</div>
				<Button
					color="primary"
					onPress={onOpen}
					radius="full"
					className="w-full sm:w-auto"
					startContent={<Plus className="w-4 h-4" />}
				>
					Novo Lançamento
				</Button>
			</div>
			<div className="flex items-center justify-between">
				<h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">
					Seus Lançamentos
				</h2>
				<span className="text-xs sm:text-sm text-slate-500">
					{events.length} {events.length === 1 ? "evento" : "eventos"}
				</span>
			</div>
			{error && (
				<div className="modern-card p-4 sm:p-5 border-l-4 border-l-red-500">
					<p className="text-red-600 text-sm sm:text-base">{error}</p>
					<Button color="primary" size="sm" className="mt-2" onPress={loadData}>
						Tentar Novamente
					</Button>
				</div>
			)}
			{!error && events.length === 0 && (
				<div className="modern-card p-8 sm:p-12 text-center">
					<div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
						<Calendar className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400" />
					</div>
					<p className="text-slate-500 mb-4">Nenhum lançamento encontrado.</p>
					<Button color="primary" radius="full" onPress={onOpen}>
						Criar seu primeiro evento
					</Button>
				</div>
			)}
			{!error && events.length > 0 && (
				<div className="space-y-3">
					{events.map((event, index) => (
						<Fragment key={event.id}>
							{(index === 0 ||
								formatDateInput(new Date(event.date)) !==
									formatDateInput(new Date(events[index - 1].date))) && (
								<h3 className="pt-3 text-sm font-semibold text-slate-600 dark:text-slate-300 first:pt-0">
									{formatDate(event.date)}
								</h3>
							)}
							<EventListItem
								event={event}
								accounts={accounts}
								categories={categories}
								onEdit={handleEdit}
								onConfirm={handleConfirm}
								onSkip={handleSkip}
								onDelete={handleDelete}
							/>
						</Fragment>
					))}
				</div>
			)}
			<EventForm
				isOpen={isOpen}
				onClose={onClose}
				onSuccess={loadData}
				accounts={accounts}
				categories={categories}
			/>
			<EventEditModal
				isOpen={isEditOpen}
				onClose={onEditClose}
				editData={editData}
				setEditData={setEditData}
				isTransferOpen={isTransferEditOpen}
				onTransferClose={onTransferEditClose}
				transferEditData={transferEditData}
				setTransferEditData={setTransferEditData}
				accounts={accounts}
				categories={categories}
				isLoading={editLoading}
				onSave={handleUpdate}
				onTransferSave={handleTransferUpdate}
			/>
		</div>
	)
}

function calculateBudgetSummary(events: Event[]) {
	const totalExpenses = events
		.filter((event) => event.type === "EXPENSE" && event.status !== "SKIPPED")
		.reduce((sum, event) => sum + Math.abs(event.amount), 0)
	const totalIncome = events
		.filter((event) => event.type === "INCOME" && event.status !== "SKIPPED")
		.reduce((sum, event) => sum + event.amount, 0)
	const confirmedExpenses = events
		.filter((event) => event.type === "EXPENSE" && event.status === "CONFIRMED")
		.reduce((sum, event) => sum + Math.abs(event.amount), 0)
	return {
		totalExpenses,
		totalIncome,
		confirmedExpenses,
		progress: totalExpenses > 0 ? (confirmedExpenses / totalExpenses) * 100 : 0,
	}
}

function formatDate(date: Date) {
	const currentDate = new Date(date)
	const today = new Date()
	const yesterday = new Date(today)
	yesterday.setDate(yesterday.getDate() - 1)
	if (currentDate.toDateString() === today.toDateString()) return "Hoje"
	if (currentDate.toDateString() === yesterday.toDateString()) return "Ontem"
	return [
		String(currentDate.getDate()).padStart(2, "0"),
		String(currentDate.getMonth() + 1).padStart(2, "0"),
		currentDate.getFullYear(),
	].join("/")
}
