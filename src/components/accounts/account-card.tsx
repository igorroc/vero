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
import {
	ArrowRightLeft,
	Banknote,
	Landmark,
	MoreVertical,
	Pencil,
	PiggyBank,
	TrendingUp,
} from "lucide-react"
import type { AccountWithBalance } from "@/features/accounts"
import { formatCurrency } from "@/types/finance"

interface AccountCardProps {
	account: AccountWithBalance
	canTransfer: boolean
	onEdit: (account: AccountWithBalance) => void
	onTransfer: (account: AccountWithBalance) => void
	onDelete: (accountId: string) => void
}

const typeColors = {
	BANK: "primary",
	CASH: "secondary",
	INVESTMENT: "success",
} as const

const typeLabels = {
	BANK: "Banco",
	CASH: "Dinheiro",
	INVESTMENT: "Investimento",
} as const

export function AccountCard({
	account,
	canTransfer,
	onEdit,
	onTransfer,
	onDelete,
}: AccountCardProps) {
	const isInvestment = account.type === "INVESTMENT"
	const AccountIcon = getAccountIcon(account.type)

	return (
		<div
			className={`modern-card p-4 ${isInvestment ? "opacity-75 transition-opacity hover:opacity-100" : ""}`}
		>
			<div className="flex justify-between items-center">
				<Link
					href={`/accounts/${account.id}`}
					className="flex min-w-0 items-center gap-4 rounded-lg transition-opacity hover:opacity-75"
				>
					<div
						className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getAccountGradient(account.type)} flex items-center justify-center`}
					>
						<AccountIcon className="w-6 h-6 text-white" />
					</div>
					<div>
						<div className="flex items-center gap-2 mb-1">
							<Chip color={typeColors[account.type]} variant="flat" size="sm">
								{typeLabels[account.type]}
							</Chip>
						</div>
						<p className="font-semibold text-lg text-slate-900 dark:text-white">
							{account.name}
						</p>
						<p className="text-sm text-slate-500">
							Saldo inicial: {formatCurrency(account.initialBalance)}
						</p>
					</div>
				</Link>
				<div className="flex items-center gap-4">
					<span
						className={`text-2xl font-bold ${account.currentBalance < 0 ? "text-red-600" : "text-slate-900 dark:text-white"}`}
					>
						{formatCurrency(account.currentBalance)}
					</span>
					<Dropdown>
						<DropdownTrigger>
							<Button isIconOnly variant="light" size="sm">
								<MoreVertical className="w-4 h-4" />
							</Button>
						</DropdownTrigger>
						<DropdownMenu
							aria-label="Ações da conta"
							onAction={(key) => {
								if (key === "edit") onEdit(account)
								if (key === "transfer") onTransfer(account)
								if (key === "delete") onDelete(account.id)
							}}
						>
							<DropdownItem
								key="edit"
								startContent={<Pencil className="w-4 h-4" />}
							>
								Editar
							</DropdownItem>
							{canTransfer ? (
								<DropdownItem
									key="transfer"
									startContent={<ArrowRightLeft className="w-4 h-4" />}
								>
									Transferir
								</DropdownItem>
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

function getAccountIcon(type: AccountWithBalance["type"]) {
	switch (type) {
		case "BANK":
			return Landmark
		case "CASH":
			return Banknote
		case "INVESTMENT":
			return TrendingUp
		default:
			return PiggyBank
	}
}

function getAccountGradient(type: AccountWithBalance["type"]) {
	switch (type) {
		case "BANK":
			return "from-blue-500 to-blue-600"
		case "CASH":
			return "from-green-500 to-emerald-600"
		case "INVESTMENT":
			return "from-purple-500 to-violet-600"
		default:
			return "from-slate-500 to-slate-600"
	}
}
