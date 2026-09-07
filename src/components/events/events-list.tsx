"use client"

import { Fragment, useEffect, useState } from "react"
import {
	Button,
	Chip,
	Dropdown,
	DropdownTrigger,
	DropdownMenu,
	DropdownItem,
	Spinner,
	useDisclosure,
	Modal,
	ModalContent,
	ModalHeader,
	ModalBody,
	ModalFooter,
	Input,
	Select,
	SelectItem,
	SelectSection,
} from "@nextui-org/react"
import {
	getEvents,
	confirmEvent,
	skipEvent,
	deleteEvent,
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
	formatCurrency,
	centsToDollars,
	dateFromInput,
	formatDateInput,
} from "@/types/finance"
import type { Event } from "@prisma/client"
import { toast } from "react-toastify"
import { EventForm } from "./event-form"
import { useEventsFilterStore } from "@/stores/events-filter-store"
import {
	Plus,
	MoreVertical,
	Calendar,
	Pencil,
	ShoppingBag,
	Utensils,
	Car,
	Home,
	TrendingUp,
	Heart,
	Zap,
	CreditCard,
	CircleDollarSign,
	ChevronDown,
	ArrowLeftRight,
} from "lucide-react"

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
	const [editLoading, setEditLoading] = useState(false)
	const {
		isOpen: isTransferEditOpen,
		onOpen: onTransferEditOpen,
		onClose: onTransferEditClose,
	} = useDisclosure()
	const [transferEditData, setTransferEditData] = useState<{
		id: string
		description: string
		amount: string
		date: string
	} | null>(null)
	const [editData, setEditData] = useState<{
		id: string
		accountId: string
		categoryId: string
		description: string
		amount: string
		type: "INCOME" | "EXPENSE" | "INVESTMENT"
		costType: "RECURRENT" | "EXCEPTIONAL"
		date: string
		isGenerated: boolean
		templateId?: string
	} | null>(null)

	useEffect(() => {
		loadData()
	}, [statusFilter])

	const loadData = async () => {
		setLoading(true)
		setError(null)

		// Load accounts
		const accountsResult = await getAccountBalances()
		if (accountsResult.success) {
			setAccounts(accountsResult.accounts)
		}

		const categoriesResult = await getCategories()
		if (categoriesResult.success) {
			setCategories(categoriesResult.categories)
		}

		let result

		switch (statusFilter) {
			case "pending":
				result = await getEvents({ status: "PLANNED" })
				break
			case "confirmed":
				result = await getEvents({ status: "CONFIRMED" })
				break
			case "all":
			default: {
				result = await getEvents({})
				break
			}
		}

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
		} else {
			setError(result.error)
		}

		setLoading(false)
	}

	const handleConfirm = async (eventId: string) => {
		const result = await confirmEvent(eventId)
		if (result.success) {
			toast.success("Evento confirmado")
			loadData()
		} else {
			toast.error(result.error)
		}
	}

	const handleSkip = async (eventId: string) => {
		const result = await skipEvent(eventId)
		if (result.success) {
			toast.success("Evento ignorado")
			loadData()
		} else {
			toast.error(result.error)
		}
	}

	const handleDelete = async (eventId: string) => {
		if (!confirm("Tem certeza que deseja excluir este evento?")) return

		const result = await deleteEvent(eventId)
		if (result.success) {
			toast.success("Evento excluído")
			loadData()
		} else {
			toast.error(result.error)
		}
	}

	const formatDate = (date: Date) => {
		const d = new Date(date)
		const today = new Date()
		const yesterday = new Date(today)
		yesterday.setDate(yesterday.getDate() - 1)

		if (d.toDateString() === today.toDateString()) return "Hoje"
		if (d.toDateString() === yesterday.toDateString()) return "Ontem"

		return [
			String(d.getDate()).padStart(2, "0"),
			String(d.getMonth() + 1).padStart(2, "0"),
			d.getFullYear(),
		].join("/")
	}

	const isPast = (date: Date) => {
		const today = new Date()
		today.setHours(0, 0, 0, 0)
		const d = new Date(date)
		return d < today
	}

	const typeColors: Record<
		string,
		"success" | "danger" | "primary" | "secondary"
	> = {
		INCOME: "success",
		EXPENSE: "danger",
		INVESTMENT: "primary",
		TRANSFER: "secondary",
	}

	const typeLabels: Record<string, string> = {
		INCOME: "Receita",
		EXPENSE: "Despesa",
		INVESTMENT: "Investimento",
		TRANSFER: "Transferência",
	}

	const statusColors: Record<string, "default" | "success" | "warning"> = {
		PLANNED: "warning",
		CONFIRMED: "success",
		SKIPPED: "default",
	}

	const statusLabels: Record<string, string> = {
		PLANNED: "Planejado",
		CONFIRMED: "Confirmado",
		SKIPPED: "Ignorado",
	}

	// Icon and color mapping for event types
	const getEventIcon = (description: string, type: string) => {
		if (type === "TRANSFER") return ArrowLeftRight

		const desc = description.toLowerCase()
		if (
			desc.includes("transporte") ||
			desc.includes("uber") ||
			desc.includes("99") ||
			desc.includes("carro") ||
			desc.includes("gasolina")
		)
			return Car
		if (
			desc.includes("aluguel") ||
			desc.includes("casa") ||
			desc.includes("moradia")
		)
			return Home
		if (
			desc.includes("mercado") ||
			desc.includes("compra") ||
			desc.includes("shopping")
		)
			return ShoppingBag
		if (
			desc.includes("restaurante") ||
			desc.includes("comida") ||
			desc.includes("alimenta")
		)
			return Utensils
		if (
			desc.includes("saúde") ||
			desc.includes("médico") ||
			desc.includes("farmácia")
		)
			return Heart
		if (
			desc.includes("energia") ||
			desc.includes("luz") ||
			desc.includes("água") ||
			desc.includes("internet")
		)
			return Zap
		if (type === "INVESTMENT") return TrendingUp
		if (type === "INCOME") return CircleDollarSign
		return CreditCard
	}

	const getEventColors = (type: string) => {
		if (type === "INCOME")
			return {
				bg: "bg-emerald-100 dark:bg-emerald-900/30",
				icon: "text-emerald-600 dark:text-emerald-400",
			}
		if (type === "INVESTMENT")
			return {
				bg: "bg-blue-100 dark:bg-blue-900/30",
				icon: "text-blue-600 dark:text-blue-400",
			}
		if (type === "TRANSFER")
			return {
				bg: "bg-violet-100 dark:bg-violet-900/30",
				icon: "text-violet-600 dark:text-violet-400",
			}
		return {
			bg: "bg-rose-100 dark:bg-rose-900/30",
			icon: "text-rose-600 dark:text-rose-400",
		}
	}

	// Calculate budget summary
	const calculateBudgetSummary = () => {
		const totalExpenses = events
			.filter((e) => e.type === "EXPENSE" && e.status !== "SKIPPED")
			.reduce((sum, e) => sum + Math.abs(e.amount), 0)
		const totalIncome = events
			.filter((e) => e.type === "INCOME" && e.status !== "SKIPPED")
			.reduce((sum, e) => sum + e.amount, 0)
		const confirmedExpenses = events
			.filter((e) => e.type === "EXPENSE" && e.status === "CONFIRMED")
			.reduce((sum, e) => sum + Math.abs(e.amount), 0)

		return {
			totalExpenses,
			totalIncome,
			confirmedExpenses,
			progress:
				totalExpenses > 0 ? (confirmedExpenses / totalExpenses) * 100 : 0,
		}
	}

	const budgetSummary = calculateBudgetSummary()

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
		// Check if this is a generated event
		const isGenerated = event.id.startsWith("generated-")
		let targetId = event.id
		let templateId: string | undefined

		if (isGenerated) {
			// Extract template ID for generated events
			const parts = event.id.split("-")
			templateId = parts.slice(1, -1).join("-")
			targetId = templateId
		}

		setEditData({
			id: targetId,
			accountId: event.accountId,
			categoryId: event.categoryId || "",
			description: event.description,
			amount: centsToDollars(Math.abs(event.amount)).toString(),
			type: event.type as "INCOME" | "EXPENSE" | "INVESTMENT",
			costType: (event.costType as "RECURRENT" | "EXCEPTIONAL") || "RECURRENT",
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
		} else {
			toast.error(result.error)
		}

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
		} else {
			toast.error(result.error)
		}
		setEditLoading(false)
	}

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<Spinner size="lg" label="Carregando eventos..." />
			</div>
		)
	}

	// Get current month name
	const currentMonth = new Date().toLocaleDateString("pt-BR", {
		month: "long",
	})

	return (
		<div className="space-y-4 sm:space-y-6">
			{/* Budget Summary Card - Inspired by Figma */}
			{events.length > 0 && (
				<div className="bg-gradient-to-r from-indigo-900 to-indigo-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-white relative overflow-hidden">
					{/* Decorative elements */}
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

					{/* Progress bar */}
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

					{/* Mobile income display */}
					<div className="mt-3 sm:hidden flex justify-between text-sm">
						<span className="text-indigo-200">Receitas esperadas</span>
						<span className="text-emerald-400 font-medium">
							+{formatCurrency(budgetSummary.totalIncome)}
						</span>
					</div>
				</div>
			)}

			{/* Header with filters */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
				{/* Mobile: Dropdown filter */}
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
							onSelectionChange={(keys) => {
								const value = Array.from(keys)[0] as typeof statusFilter
								setStatusFilter(value)
							}}
						>
							<DropdownItem key="all">Todos os lançamentos</DropdownItem>
							<DropdownItem key="pending">Pendentes</DropdownItem>
							<DropdownItem key="confirmed">Confirmados</DropdownItem>
						</DropdownMenu>
					</Dropdown>
				</div>

				{/* Desktop: Button group filter */}
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

			{/* Section title */}
			<div className="flex items-center justify-between">
				<h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">
					Seus Lançamentos
				</h2>
				<span className="text-xs sm:text-sm text-slate-500">
					{events.length} {events.length === 1 ? "evento" : "eventos"}
				</span>
			</div>

			{/* Events list */}
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
					{events.map((event, index) => {
						const EventIcon = getEventIcon(event.description, event.type)
						const colors = getEventColors(event.type)
						const category = categories.find(
							(item) => item.id === event.categoryId,
						)
						const sourceAccount = accounts.find(
							(account) => account.id === event.accountId,
						)
						const destinationAccount = accounts.find(
							(account) => account.id === event.destinationAccountId,
						)
						const isOverdue = isPast(event.date) && event.status === "PLANNED"
						const isNewDate =
							index === 0 ||
							formatDateInput(new Date(event.date)) !==
								formatDateInput(new Date(events[index - 1].date))

						return (
							<Fragment key={event.id}>
								{isNewDate && (
									<h3 className="pt-3 text-sm font-semibold text-slate-600 dark:text-slate-300 first:pt-0">
										{formatDate(event.date)}
									</h3>
								)}
								<div
									className={`bg-white dark:bg-slate-900 rounded-2xl sm:rounded-[20px] p-3 sm:p-4 shadow-sm hover:shadow-md transition-shadow border border-slate-100 dark:border-slate-800 ${
										isOverdue ? "ring-2 ring-amber-400/50" : ""
									}`}
								>
									<div className="flex items-center gap-3 sm:gap-4">
										{/* Icon */}
										<div
											className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl sm:rounded-[18px] ${colors.bg} flex items-center justify-center flex-shrink-0`}
										>
											<EventIcon
												className={`w-6 h-6 sm:w-8 sm:h-8 ${colors.icon}`}
											/>
										</div>

										{/* Content */}
										<div className="flex-1 min-w-0">
											<div className="flex items-start justify-between gap-2">
												<div className="min-w-0">
													<h3 className="font-semibold text-slate-900 dark:text-white text-sm sm:text-base truncate">
														{event.description}
													</h3>
													<p
														className={`text-xs sm:text-sm mt-0.5 ${
															isOverdue ? "text-amber-600" : "text-slate-500"
														}`}
													>
														{event.type === "TRANSFER"
															? `De ${sourceAccount?.name ?? "conta de origem"} para ${destinationAccount?.name ?? "conta de destino"}`
															: event.type === "INCOME"
																? `Entrou em: ${sourceAccount?.name ?? "conta não encontrada"}`
																: `Saiu de: ${sourceAccount?.name ?? "conta não encontrada"}`}
														{isOverdue && " • Atrasado"}
													</p>
												</div>

												<div className="text-right flex-shrink-0">
													<p
														className={`font-semibold text-sm sm:text-base ${
															event.amount > 0
																? "text-emerald-600"
																: "text-slate-900 dark:text-white"
														}`}
													>
														{event.amount > 0 ? "+" : ""}
														{formatCurrency(event.amount)}
													</p>
													<p className="text-xs text-slate-400 mt-0.5 hidden sm:block">
														{statusLabels[event.status]}
													</p>
												</div>
											</div>

											{/* Tags row */}
											<div className="flex items-center gap-1.5 sm:gap-2 mt-2 flex-wrap">
												<Chip
													size="sm"
													variant="flat"
													color={typeColors[event.type]}
													className="text-[10px] sm:text-xs h-5 sm:h-6"
												>
													{typeLabels[event.type]}
												</Chip>
												{category && (
													<Chip
														size="sm"
														variant="flat"
														className="text-[10px] sm:text-xs h-5 sm:h-6"
													>
														{category.categoryGroup.name}: {category.name}
													</Chip>
												)}
												{event.isRecurrenceTemplate && (
													<Chip
														size="sm"
														variant="flat"
														color="secondary"
														className="text-[10px] sm:text-xs h-5 sm:h-6"
													>
														Recorrente
													</Chip>
												)}
												{/* Mobile status chip */}
												<Chip
													size="sm"
													variant="bordered"
													color={statusColors[event.status]}
													className="text-[10px] sm:text-xs h-5 sm:h-6 sm:hidden ml-auto"
												>
													{statusLabels[event.status]}
												</Chip>
											</div>
										</div>

										{/* Actions menu */}
										<Dropdown>
											<DropdownTrigger>
												<Button
													isIconOnly
													variant="light"
													size="sm"
													radius="full"
													className="flex-shrink-0"
												>
													<MoreVertical className="w-4 h-4 sm:w-5 sm:h-5" />
												</Button>
											</DropdownTrigger>
											<DropdownMenu
												aria-label="Ações do evento"
												onAction={(key) => {
													if (key === "edit") handleEdit(event)
													if (key === "confirm") handleConfirm(event.id)
													if (key === "skip") handleSkip(event.id)
													if (key === "delete") handleDelete(event.id)
												}}
											>
												<DropdownItem
													key="edit"
													startContent={<Pencil className="w-4 h-4" />}
												>
													{event.id.startsWith("generated-")
														? "Editar Modelo"
														: "Editar"}
												</DropdownItem>
												{event.status === "PLANNED" ? (
													<DropdownItem key="confirm">Confirmar</DropdownItem>
												) : null}
												{event.status === "PLANNED" ? (
													<DropdownItem key="skip">Ignorar</DropdownItem>
												) : null}
												<DropdownItem
													key="delete"
													className="text-danger"
													color="danger"
												>
													Excluir
												</DropdownItem>
											</DropdownMenu>
										</Dropdown>
									</div>
								</div>
							</Fragment>
						)
					})}
				</div>
			)}

			{/* Event form modal */}
			<EventForm
				isOpen={isOpen}
				onClose={onClose}
				onSuccess={loadData}
				accounts={accounts}
				categories={categories}
			/>

			{/* Edit event modal */}
			<Modal
				isOpen={isEditOpen}
				onClose={onEditClose}
				size="lg"
				scrollBehavior="inside"
				classNames={{
					base: "mx-2 sm:mx-0",
					body: "py-4",
				}}
			>
				<ModalContent>
					<ModalHeader className="text-lg sm:text-xl">
						{editData?.isGenerated
							? "Editar Modelo Recorrente"
							: "Editar Evento"}
					</ModalHeader>
					<ModalBody className="gap-3 sm:gap-4">
						{editData?.isGenerated && (
							<div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
								<p className="text-xs sm:text-sm text-amber-700 dark:text-amber-300">
									As alterações afetarão todas as ocorrências futuras.
								</p>
							</div>
						)}

						<Select
							label="Conta"
							size="sm"
							selectedKeys={editData?.accountId ? [editData.accountId] : []}
							onSelectionChange={(keys) => {
								const value = Array.from(keys)[0] as string
								setEditData((prev) =>
									prev ? { ...prev, accountId: value } : null,
								)
							}}
							isRequired
							classNames={{ label: "text-sm" }}
						>
							{accounts.map((account) => (
								<SelectItem key={account.id} textValue={account.name}>
									{account.name}
								</SelectItem>
							))}
						</Select>

						<Input
							label="Descrição"
							size="sm"
							placeholder="Ex: Aluguel mensal"
							value={editData?.description || ""}
							onValueChange={(value) =>
								setEditData((prev) =>
									prev ? { ...prev, description: value } : null,
								)
							}
							isRequired
							classNames={{ label: "text-sm" }}
						/>

						<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
							<Input
								label="Valor"
								size="sm"
								type="number"
								placeholder="0,00"
								startContent={<span className="text-gray-500 text-sm">R$</span>}
								value={editData?.amount || ""}
								onValueChange={(value) =>
									setEditData((prev) =>
										prev ? { ...prev, amount: value } : null,
									)
								}
								isRequired
								classNames={{ label: "text-sm" }}
							/>

							<Select
								label="Tipo"
								size="sm"
								selectedKeys={editData?.type ? [editData.type] : []}
								onSelectionChange={(keys) => {
									const value = Array.from(keys)[0] as
										"INCOME" | "EXPENSE" | "INVESTMENT"
									setEditData((prev) =>
										prev
											? {
													...prev,
													type: value,
													categoryId: "",
												}
											: null,
									)
								}}
								isRequired
								classNames={{ label: "text-sm" }}
							>
								<SelectItem key="INCOME" textValue="Receita">
									Receita (+)
								</SelectItem>
								<SelectItem key="EXPENSE" textValue="Despesa">
									Despesa (-)
								</SelectItem>
								<SelectItem key="INVESTMENT" textValue="Investimento">
									Investimento (-)
								</SelectItem>
							</Select>
						</div>

						{editData && (
							<>
								<Select
									label="Categoria"
									size="sm"
									selectedKeys={
										editData.categoryId ? [editData.categoryId] : []
									}
									onSelectionChange={(keys) =>
										setEditData((prev) =>
											prev
												? {
														...prev,
														categoryId: String(Array.from(keys)[0] ?? ""),
													}
												: null,
										)
									}
									isRequired
									isDisabled={categories.length === 0}
								>
									{Array.from(
										new Map(
											categories
												.filter((category) =>
													editData.type === "INCOME"
														? category.categoryGroup.type === "INCOME"
														: editData.type === "INVESTMENT"
															? category.categoryGroup.type === "INVESTMENT"
															: ["ESSENTIAL", "LIFESTYLE"].includes(
																	category.categoryGroup.type,
																),
												)
												.map((category) => [
													category.categoryGroup.id,
													category.categoryGroup,
												]),
										).values(),
									).map((group) => (
										<SelectSection key={group.id} title={group.name}>
											{categories
												.filter(
													(category) => category.categoryGroupId === group.id,
												)
												.map((category) => (
													<SelectItem key={category.id}>
														{category.name}
													</SelectItem>
												))}
										</SelectSection>
									))}
								</Select>
								{editData.type === "EXPENSE" && (
									<Select
										label="Tipo de Custo"
										size="sm"
										selectedKeys={editData?.costType ? [editData.costType] : []}
										onSelectionChange={(keys) => {
											const value = Array.from(keys)[0] as
												"RECURRENT" | "EXCEPTIONAL"
											setEditData((prev) =>
												prev ? { ...prev, costType: value } : null,
											)
										}}
										classNames={{ label: "text-sm" }}
									>
										<SelectItem key="RECURRENT" textValue="Recorrente">
											Recorrente (aluguel, contas)
										</SelectItem>
										<SelectItem key="EXCEPTIONAL" textValue="Excepcional">
											Excepcional (viagens, emergências)
										</SelectItem>
									</Select>
								)}
							</>
						)}

						<Input
							label="Data"
							size="sm"
							type="date"
							value={editData?.date || ""}
							onValueChange={(value) =>
								setEditData((prev) => (prev ? { ...prev, date: value } : null))
							}
							isRequired
							classNames={{ label: "text-sm" }}
						/>
					</ModalBody>
					<ModalFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
						<Button
							variant="flat"
							onPress={onEditClose}
							className="w-full sm:w-auto order-2 sm:order-1"
						>
							Cancelar
						</Button>
						<Button
							color="primary"
							onPress={handleUpdate}
							isLoading={editLoading}
							className="w-full sm:w-auto order-1 sm:order-2"
						>
							Salvar Alterações
						</Button>
					</ModalFooter>
				</ModalContent>
			</Modal>

			<Modal isOpen={isTransferEditOpen} onClose={onTransferEditClose}>
				<ModalContent>
					<ModalHeader>Editar transferência</ModalHeader>
					<ModalBody>
						<Input
							label="Descrição"
							value={transferEditData?.description ?? ""}
							onValueChange={(description) =>
								setTransferEditData((current) =>
									current ? { ...current, description } : null,
								)
							}
							isRequired
						/>
						<Input
							label="Valor"
							type="number"
							min="0.01"
							step="0.01"
							startContent="R$"
							value={transferEditData?.amount ?? ""}
							onValueChange={(amount) =>
								setTransferEditData((current) =>
									current ? { ...current, amount } : null,
								)
							}
							isRequired
						/>
						<Input
							label="Data"
							type="date"
							value={transferEditData?.date ?? ""}
							onValueChange={(date) =>
								setTransferEditData((current) =>
									current ? { ...current, date } : null,
								)
							}
							isRequired
						/>
					</ModalBody>
					<ModalFooter>
						<Button variant="flat" onPress={onTransferEditClose}>
							Cancelar
						</Button>
						<Button
							color="primary"
							onPress={handleTransferUpdate}
							isLoading={editLoading}
						>
							Salvar alterações
						</Button>
					</ModalFooter>
				</ModalContent>
			</Modal>
		</div>
	)
}
