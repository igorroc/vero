"use client"

import { Card, CardBody, CardHeader } from "@nextui-org/react"
import { formatCurrency, type Cents } from "@/types/finance"
import type { AccountWithBalance } from "@/features/accounts"
import { AccountSummaryItem } from "./account-summary-item"

interface AccountsSummaryProps {
	accounts: AccountWithBalance[]
	totalBalance: Cents
}

export function AccountsSummary({
	accounts,
	totalBalance,
}: AccountsSummaryProps) {
	return (
		<Card className="w-full">
			<CardHeader className="flex flex-col items-start gap-2 pb-0">
				<div className="flex justify-between items-center w-full">
					<h2 className="text-xl font-semibold">Accounts</h2>
					<span className="text-2xl font-bold text-primary">
						{formatCurrency(totalBalance)}
					</span>
				</div>
			</CardHeader>
			<CardBody>
				{accounts.length === 0 ? (
					<p className="text-gray-500 text-center py-4">
						No accounts yet. Add your first account to get started.
					</p>
				) : (
					<div className="space-y-3">
						{accounts.map((account) => (
							<AccountSummaryItem key={account.id} account={account} />
						))}
					</div>
				)}
			</CardBody>
		</Card>
	)
}
