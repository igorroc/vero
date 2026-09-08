"use client"

import Link from "next/link"
import { Button, Chip } from "@nextui-org/react"
import { formatCurrency } from "@/types/finance"
import { DebtInstallmentRow } from "./debt-installment-row"
import type { DebtInstallment, DebtView } from "./debt-types"

type DebtCardProps = {
	debt: DebtView
	showDetailLink: boolean
	onPay: (installment: DebtInstallment) => void
	onGenerate: (debt: DebtView) => void
}

export function DebtCard({
	debt,
	showDetailLink,
	onPay,
	onGenerate,
}: DebtCardProps) {
	const paid = debt.totalAmount - debt.outstandingAmount
	const progress = debt.totalAmount
		? Math.round((paid / debt.totalAmount) * 100)
		: 0

	return (
		<section className="modern-card p-5 space-y-4">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
				<div>
					<div className="flex items-center gap-2">
						<h2 className="text-lg font-semibold">{debt.creditor}</h2>
						<Chip
							size="sm"
							color={debt.status === "PAID" ? "success" : "warning"}
							variant="flat"
						>
							{debt.status === "PAID" ? "Quitada" : "Ativa"}
						</Chip>
					</div>
					<p className="text-sm text-slate-500">{debt.description}</p>
					<p className="mt-1 text-xs text-slate-400">
						{debt.category.name} · {debt.installmentCount} parcelas geradas
					</p>
				</div>
				<div className="text-left sm:text-right">
					<p className="text-xs text-slate-500">Em aberto</p>
					<p className="text-xl font-bold text-red-600">
						{formatCurrency(debt.outstandingAmount)}
					</p>
				</div>
			</div>
			<div>
				<div className="mb-1 flex justify-between text-xs text-slate-500">
					<span>Progresso de pagamento</span>
					<span>{progress}%</span>
				</div>
				<div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
					<div
						className="h-full bg-gradient-to-r from-amber-500 to-emerald-500"
						style={{ width: `${progress}%` }}
					/>
				</div>
			</div>
			{!showDetailLink && (
				<div className="space-y-2 border-t pt-4">
					{debt.installments.length === 0 && debt.status === "ACTIVE" ? (
						<div className="flex flex-col gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50 sm:flex-row sm:items-center sm:justify-between">
							<p className="text-sm text-slate-500">
								Nenhuma parcela futura foi gerada.
							</p>
							<Button
								size="sm"
								color="primary"
								onPress={() => onGenerate(debt)}
							>
								Gerar parcelas
							</Button>
						</div>
					) : (
						debt.installments.map((installment) => (
							<DebtInstallmentRow
								key={installment.id}
								debt={debt}
								installment={installment}
								onPay={onPay}
							/>
						))
					)}
				</div>
			)}
			{showDetailLink && (
				<Link
					className="inline-flex text-sm font-medium text-primary"
					href={`/debts/${debt.id}`}
				>
					Ver parcelas e pagamentos
				</Link>
			)}
		</section>
	)
}
