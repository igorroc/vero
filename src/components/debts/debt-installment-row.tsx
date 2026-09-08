"use client"

import { Button } from "@nextui-org/react"
import { formatCurrency } from "@/types/finance"
import type { DebtInstallment, DebtView } from "./debt-types"

type DebtInstallmentRowProps = {
	debt: DebtView
	installment: DebtInstallment
	onPay: (installment: DebtInstallment) => void
}

export function DebtInstallmentRow({
	debt,
	installment,
	onPay,
}: DebtInstallmentRowProps) {
	return (
		<div className="flex flex-col gap-2 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50 sm:flex-row sm:items-center sm:justify-between">
			<div>
				<p className="font-medium">
					Parcela {installment.number}/{debt.installmentCount}
				</p>
				<p className="text-xs text-slate-500">
					{new Intl.DateTimeFormat("pt-BR").format(installment.dueDate)} ·
					previsto: {formatCurrency(installment.plannedAmount)}
				</p>
				{installment.payments.map((payment) => (
					<p key={payment.id} className="text-xs text-emerald-600">
						Pago {formatCurrency(payment.amount)} via{" "}
						{payment.event.account.name}
					</p>
				))}
			</div>
			{debt.status === "ACTIVE" && debt.outstandingAmount > 0 && (
				<Button
					size="sm"
					color="primary"
					variant="flat"
					onPress={() => onPay(installment)}
				>
					Registrar pagamento
				</Button>
			)}
		</div>
	)
}
