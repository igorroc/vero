"use client"

import { Chip } from "@nextui-org/react"
import {
	ArrowLeftRight,
	CircleDollarSign,
	CreditCard,
	TrendingUp,
} from "lucide-react"
import type { AccountStatement } from "@/features/accounts"
import { formatCurrency } from "@/types/finance"

type StatementEntry = AccountStatement["days"][number]["entries"][number]

interface AccountStatementEntryProps {
	entry: StatementEntry
}

export function AccountStatementEntry({ entry }: AccountStatementEntryProps) {
	const isCredit = entry.amount > 0
	const isTransfer = entry.type === "TRANSFER"
	const Icon = isTransfer
		? ArrowLeftRight
		: entry.type === "INCOME"
			? CircleDollarSign
			: entry.type === "INVESTMENT"
				? TrendingUp
				: CreditCard
	const iconColors = isTransfer
		? isCredit
			? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30"
			: "bg-rose-100 text-rose-600 dark:bg-rose-900/30"
		: entry.type === "INCOME"
			? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30"
			: entry.type === "INVESTMENT"
				? "bg-blue-100 text-blue-600 dark:bg-blue-900/30"
				: "bg-rose-100 text-rose-600 dark:bg-rose-900/30"
	const label = isTransfer
		? entry.isIncomingTransfer
			? "Transferência recebida"
			: "Transferência enviada"
		: entry.type === "INCOME"
			? "Receita"
			: entry.type === "INVESTMENT"
				? "Investimento"
				: "Despesa"

	return (
		<div className="flex items-center justify-between gap-3 border-b p-4 last:border-0">
			<div className="flex min-w-0 items-center gap-3">
				<div
					className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconColors}`}
				>
					<Icon className="h-5 w-5" />
				</div>
				<div className="min-w-0">
					<p className="truncate font-medium">{entry.description}</p>
					<Chip size="sm" variant="flat" className="mt-1 text-[10px]">
						{label}
					</Chip>
				</div>
			</div>
			<div className="shrink-0 text-right">
				<p
					className={
						isCredit
							? "font-semibold text-emerald-600"
							: "font-semibold text-rose-600"
					}
				>
					{isCredit ? "+" : ""}
					{formatCurrency(entry.amount)}
				</p>
				<p className="text-xs text-slate-500">
					Saldo: {formatCurrency(entry.balanceAfter)}
				</p>
			</div>
		</div>
	)
}
