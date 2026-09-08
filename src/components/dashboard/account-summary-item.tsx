"use client"

import { Chip } from "@nextui-org/react"
import type { AccountWithBalance } from "@/features/accounts"
import { formatCurrency } from "@/types/finance"

interface AccountSummaryItemProps {
	account: AccountWithBalance
}

const accountTypeColors: Record<string, "primary" | "secondary" | "success"> = {
	BANK: "primary",
	CASH: "secondary",
	INVESTMENT: "success",
}

export function AccountSummaryItem({ account }: AccountSummaryItemProps) {
	return (
		<div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
			<div className="flex items-center gap-3">
				<Chip
					color={accountTypeColors[account.type] || "default"}
					size="sm"
					variant="flat"
				>
					{account.type}
				</Chip>
				<span className="font-medium">{account.name}</span>
			</div>
			<span
				className={`font-semibold ${account.currentBalance < 0 ? "text-red-500" : ""}`}
			>
				{formatCurrency(account.currentBalance)}
			</span>
		</div>
	)
}
