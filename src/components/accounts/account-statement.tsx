"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button, Spinner } from "@nextui-org/react"
import { ArrowLeft, Landmark } from "lucide-react"
import { getAccountStatement, type AccountStatement } from "@/features/accounts"
import { formatCurrency } from "@/types/finance"
import { AccountStatementDay } from "./account-statement-day"

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
					<AccountStatementDay key={day.dateKey} day={day} />
				))
			)}
		</div>
	)
}
