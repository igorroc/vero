"use client"

import { Select, SelectItem } from "@nextui-org/react"
import {
	Building2,
	CheckCircle2,
	Clock,
	FileText,
	Landmark,
} from "lucide-react"
import type { Account } from "@prisma/client"

export function ReconciliationSummary({
	accounts,
	accountId,
	onAccountChange,
	fileName,
	total,
	matched,
	pending,
	disabled,
}: {
	accounts: Account[]
	accountId: string
	onAccountChange: (accountId: string) => void
	fileName: string
	total: number
	matched: number
	pending: number
	disabled?: boolean
}) {
	return (
		<div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4 dark:border-slate-800 dark:bg-slate-900">
			<div className="min-w-0 flex-1 sm:min-w-[200px]">
				<p className="mb-1 text-xs font-semibold text-slate-500">
					Conta do extrato
				</p>
				<Select
					size="sm"
					aria-label="Conta do extrato"
					selectedKeys={accountId ? [accountId] : []}
					onSelectionChange={(keys) =>
						onAccountChange(String(Array.from(keys)[0] ?? ""))
					}
					isDisabled={disabled}
					startContent={<Landmark size={16} className="shrink-0" />}
				>
					{accounts.map((account) => (
						<SelectItem key={account.id}>{account.name}</SelectItem>
					))}
				</Select>
			</div>

			<div className="min-w-0 flex-1 sm:min-w-[200px]">
				<p className="mb-1 text-xs font-semibold text-slate-500">
					Arquivo enviado
				</p>
				<div className="flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-sm dark:bg-slate-800">
					<FileText size={16} className="shrink-0 text-slate-500" />
					<span className="min-w-0 flex-1 truncate font-medium text-slate-700 dark:text-slate-200">
						{fileName}
					</span>
					<CheckCircle2 size={16} className="shrink-0 text-teal-600" />
				</div>
			</div>

			<div />

			<div className="flex items-center gap-4 sm:gap-5">
				<div className="flex items-center gap-2">
					<Building2 size={20} className="text-slate-400" />
					<div>
						<p className="text-base font-bold leading-none text-slate-900 dark:text-white">
							{total}
						</p>
						<p className="mt-1 text-[11px] text-slate-500">lançamentos</p>
					</div>
				</div>
				<div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />
				<div className="flex items-center gap-2">
					<CheckCircle2 size={20} className="text-teal-600" />
					<div>
						<p className="text-base font-bold leading-none text-slate-900 dark:text-white">
							{matched}
						</p>
						<p className="mt-1 text-[11px] text-slate-500">conciliados</p>
					</div>
				</div>
				<div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />
				<div className="flex items-center gap-2">
					<Clock size={20} className="text-amber-500" />
					<div>
						<p className="text-base font-bold leading-none text-slate-900 dark:text-white">
							{pending}
						</p>
						<p className="mt-1 text-[11px] text-slate-500">pendentes</p>
					</div>
				</div>
			</div>
		</div>
	)
}
