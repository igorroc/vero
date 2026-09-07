"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button, Chip, Spinner } from "@nextui-org/react"
import {
	ArrowLeftRight,
	ArrowLeft,
	CircleDollarSign,
	CreditCard,
	Landmark,
	TrendingUp,
} from "lucide-react"
import { getAccountStatement, type AccountStatement } from "@/features/accounts"
import { formatCurrency } from "@/types/finance"

export function AccountStatementContent({ accountId }: { accountId: string }) {
	const [statement, setStatement] = useState<AccountStatement | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	const loadStatement = async () => {
		setLoading(true)
		setError(null)
		const result = await getAccountStatement(accountId)
		if (result.success) setStatement(result.statement)
		else setError(result.error)
		setLoading(false)
	}

	useEffect(() => {
		loadStatement()
	}, [accountId])

	if (loading)
		return (
			<div className="flex min-h-64 items-center justify-center">
				<Spinner label="Carregando extrato..." />
			</div>
		)
	if (error || !statement)
		return (
			<div className="modern-card p-6 text-center">
				<p className="text-red-600">{error ?? "Conta não encontrada"}</p>
				<Button as={Link} href="/accounts" className="mt-4" color="primary">
					Voltar para contas
				</Button>
			</div>
		)

	return (
		<div className="mx-auto max-w-3xl space-y-6">
			<div className="flex items-center gap-3">
				<Button
					as={Link}
					href="/accounts"
					isIconOnly
					variant="light"
					aria-label="Voltar para contas"
				>
					<ArrowLeft className="h-5 w-5" />
				</Button>
				<div>
					<p className="text-sm text-slate-500">Extrato da conta</p>
					<h1 className="text-xl font-bold text-slate-900 dark:text-white">
						{statement.account.name}
					</h1>
				</div>
			</div>

			<div className="rounded-2xl bg-gradient-to-br from-indigo-900 to-purple-900 p-5 text-white">
				<p className="text-sm text-indigo-200">Saldo atual</p>
				<p className="mt-1 text-3xl font-bold">
					{formatCurrency(statement.currentBalance)}
				</p>
				<p className="mt-3 text-xs text-indigo-200">
					Saldo inicial: {formatCurrency(statement.account.initialBalance)}
				</p>
			</div>

			{statement.days.length === 0 ? (
				<div className="modern-card p-10 text-center">
					<Landmark className="mx-auto mb-3 h-10 w-10 text-slate-300" />
					<p className="text-slate-500">
						Ainda não há movimentações confirmadas nesta conta.
					</p>
				</div>
			) : (
				statement.days.map((day) => (
					<section key={day.dateKey} className="modern-card overflow-hidden">
						<div className="flex items-center justify-between border-b p-4">
							<div>
								<h2 className="font-semibold capitalize">
									{day.date.toLocaleDateString("pt-BR", {
										weekday: "long",
										day: "numeric",
										month: "long",
										year: "numeric",
									})}
								</h2>
								<p className="text-xs text-slate-500">
									{day.entries.length} movimenta
									{day.entries.length > 1 ? "ções" : "ção"}
								</p>
							</div>
							<div className="text-right">
								<p className="text-xs text-slate-500">Saldo do dia</p>
								<p className="font-semibold">
									{formatCurrency(day.endingBalance)}
								</p>
							</div>
						</div>
						{day.entries.map((entry) => {
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
								<div
									key={entry.id}
									className="flex items-center justify-between gap-3 border-b p-4 last:border-0"
								>
									<div className="flex min-w-0 items-center gap-3">
										<div
											className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconColors}`}
										>
											<Icon className="h-5 w-5" />
										</div>
										<div className="min-w-0">
											<p className="truncate font-medium">
												{entry.description}
											</p>
											<Chip
												size="sm"
												variant="flat"
												className="mt-1 text-[10px]"
											>
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
						})}
					</section>
				))
			)}
		</div>
	)
}
