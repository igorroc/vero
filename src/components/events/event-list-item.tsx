"use client"

import Link from "next/link"
import {
	Button,
	Chip,
	Dropdown,
	DropdownItem,
	DropdownMenu,
	DropdownTrigger,
} from "@nextui-org/react"
import type { Event } from "@prisma/client"
import type { AccountWithBalance } from "@/features/accounts"
import type { CategoryWithGroup } from "@/features/categories"
import { getEventIconKey, type EventIconKey } from "@/lib/event-icon-rules"
import { formatCurrency } from "@/types/finance"
import {
	ArrowLeftRight,
	BadgePercent,
	Banknote,
	Building2,
	Car,
	CircleDollarSign,
	CreditCard,
	Heart,
	Home,
	MoreVertical,
	Music,
	Pencil,
	Phone,
	ReceiptText,
	Scissors,
	ShoppingCart,
	TrendingUp,
	Utensils,
	Zap,
} from "lucide-react"

const eventIcons: Record<EventIconKey, typeof CreditCard> = {
	property: Building2,
	beauty: Scissors,
	income: Banknote,
	adjustment: BadgePercent,
	bill: ReceiptText,
	phone: Phone,
	education: Music,
	donation: Heart,
	transport: Car,
	housing: Home,
	shopping: ShoppingCart,
	food: Utensils,
	health: Heart,
	utilities: Zap,
	other: CreditCard,
}

interface EventListItemProps {
	event: Event
	accounts: AccountWithBalance[]
	categories: CategoryWithGroup[]
	onEdit: (event: Event) => void
	onConfirm: (eventId: string) => void
	onSkip: (eventId: string) => void
	onDelete: (eventId: string) => void
}

export function EventListItem({
	event,
	accounts,
	categories,
	onEdit,
	onConfirm,
	onSkip,
	onDelete,
}: EventListItemProps) {
	const EventIcon = getEventIcon(event.description, event.type)
	const colors = getEventColors(event.type)
	const category = categories.find((item) => item.id === event.categoryId)
	const sourceAccount = accounts.find(
		(account) => account.id === event.accountId,
	)
	const destinationAccount = accounts.find(
		(account) => account.id === event.destinationAccountId,
	)
	const isOverdue = isPast(event.date) && event.status === "PLANNED"
	const isPlanned = event.status === "PLANNED"

	return (
		<div
			className={`bg-white dark:bg-slate-900 rounded-2xl sm:rounded-[20px] p-3 sm:p-4 shadow-sm hover:shadow-md transition-shadow border border-slate-100 dark:border-slate-800 ${getStatusBorder(event.status)} ${isOverdue ? "ring-2 ring-amber-400/50" : ""}`}
			title={
				event.status === "CONFIRMED"
					? "Confirmado"
					: event.status === "PLANNED"
						? "Planejado"
						: "Ignorado"
			}
		>
			<div className="flex items-center gap-3 sm:gap-4">
				<div
					className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl sm:rounded-[18px] ${colors.bg} flex items-center justify-center flex-shrink-0`}
				>
					<EventIcon className={`w-6 h-6 sm:w-8 sm:h-8 ${colors.icon}`} />
				</div>
				<div className="flex-1 min-w-0">
					<div className="flex items-start justify-between gap-2">
						<div className="min-w-0">
							<h3 className="font-semibold text-slate-900 dark:text-white text-sm sm:text-base truncate">
								{event.description}
							</h3>
							<p
								className={`text-xs sm:text-sm mt-0.5 ${isOverdue ? "text-amber-600" : "text-slate-500"}`}
							>
								{event.type === "TRANSFER" ? (
									<>
										De{" "}
										<AccountLink
											account={sourceAccount}
											fallback="conta de origem"
										/>
										{" para "}
										<AccountLink
											account={destinationAccount}
											fallback="conta de destino"
										/>
									</>
								) : event.type === "INCOME" ? (
									<>
										{isPlanned ? "Entrará em: " : "Entrou em: "}
										<AccountLink
											account={sourceAccount}
											fallback="conta não encontrada"
										/>
									</>
								) : (
									<>
										{isPlanned ? "Sairá de: " : "Saiu de: "}
										<AccountLink
											account={sourceAccount}
											fallback="conta não encontrada"
										/>
									</>
								)}
								{isOverdue && " • Atrasado"}
							</p>
						</div>
					</div>
					<div className="flex items-center gap-1.5 sm:gap-2 mt-2 flex-wrap">
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
					</div>
				</div>
				<div className="flex items-center gap-1.5 sm:gap-2 mt-2 flex-wrap">
					<div className="text-right flex-shrink-0">
						<p
							className={`font-semibold text-sm sm:text-base ${event.amount > 0 ? "text-emerald-600" : "text-slate-900 dark:text-white"}`}
						>
							{event.amount > 0 ? "+" : ""}
							{formatCurrency(event.amount)}
						</p>
					</div>
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
								if (key === "edit") onEdit(event)
								if (key === "confirm") onConfirm(event.id)
								if (key === "skip") onSkip(event.id)
								if (key === "delete") onDelete(event.id)
							}}
						>
							<DropdownItem
								key="edit"
								startContent={<Pencil className="w-4 h-4" />}
							>
								{event.id.startsWith("generated-") ? "Editar Modelo" : "Editar"}
							</DropdownItem>
							{event.status === "PLANNED" ? (
								<DropdownItem key="confirm">Confirmar</DropdownItem>
							) : null}
							{event.status === "PLANNED" ? (
								<DropdownItem key="skip">Ignorar</DropdownItem>
							) : null}
							<DropdownItem key="delete" className="text-danger" color="danger">
								Excluir
							</DropdownItem>
						</DropdownMenu>
					</Dropdown>
				</div>
			</div>
		</div>
	)
}

function AccountLink({
	account,
	fallback,
}: {
	account: AccountWithBalance | undefined
	fallback: string
}) {
	if (!account) return fallback

	return (
		<Link
			href={`/accounts/${account.id}`}
			className="font-semibold text-slate-700 transition-colors hover:text-primary hover:underline dark:text-slate-200"
		>
			{account.name}
		</Link>
	)
}

function isPast(date: Date) {
	const today = new Date()
	today.setHours(0, 0, 0, 0)
	return new Date(date) < today
}

function getStatusBorder(status: string) {
	if (status === "CONFIRMED") return ""
	if (status === "PLANNED")
		return "border-l-4 border-l-amber-400 dark:border-l-amber-400"
	return "border-l-4 border-l-slate-300 dark:border-l-slate-600"
}

function getEventColors(type: string) {
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

function getEventIcon(description: string, type: string) {
	if (type === "TRANSFER") return ArrowLeftRight
	if (type === "INVESTMENT") return TrendingUp
	if (type === "INCOME") return CircleDollarSign

	return eventIcons[getEventIconKey(description)]
}
