"use client"

import {
	Button,
	Input,
	Modal,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalHeader,
	Select,
	SelectItem,
} from "@nextui-org/react"
import type { AccountWithBalance } from "@/features/accounts"
import { formatCurrency } from "@/types/finance"
import type { DebtInstallment, PaymentFormState } from "./debt-types"

type PaymentModalProps = {
	isOpen: boolean
	onClose: () => void
	loading: boolean
	form: PaymentFormState
	accounts: AccountWithBalance[]
	installment: DebtInstallment | null
	onChange: (form: PaymentFormState) => void
	onSubmit: () => void
}

export function PaymentModal({
	isOpen,
	onClose,
	loading,
	form,
	accounts,
	installment,
	onChange,
	onSubmit,
}: PaymentModalProps) {
	return (
		<Modal isOpen={isOpen} onClose={onClose} size="md">
			<ModalContent>
				<ModalHeader>Registrar pagamento</ModalHeader>
				<ModalBody className="gap-4">
					<p className="text-sm text-slate-500">
						Parcela {installment?.number} · previsto agora:{" "}
						{formatCurrency(installment?.plannedAmount ?? 0)}
					</p>
					<Select
						label="Conta de pagamento"
						selectedKeys={form.accountId ? [form.accountId] : []}
						onSelectionChange={(keys) =>
							onChange({
								...form,
								accountId: String(Array.from(keys)[0] ?? ""),
							})
						}
						isRequired
					>
						{accounts.map((account) => (
							<SelectItem key={account.id}>{account.name}</SelectItem>
						))}
					</Select>
					<Input
						label="Valor pago"
						type="number"
						startContent="R$"
						value={form.amount}
						onValueChange={(amount) => onChange({ ...form, amount })}
						isRequired
					/>
					<Input
						label="Data do pagamento"
						type="date"
						value={form.date}
						onValueChange={(date) => onChange({ ...form, date })}
						isRequired
					/>
					<p className="text-xs text-slate-500">
						Valores diferentes do previsto recalculam as parcelas futuras.
					</p>
				</ModalBody>
				<ModalFooter>
					<Button variant="flat" onPress={onClose}>
						Cancelar
					</Button>
					<Button color="primary" isLoading={loading} onPress={onSubmit}>
						Confirmar pagamento
					</Button>
				</ModalFooter>
			</ModalContent>
		</Modal>
	)
}
