"use client"

import {
	Button,
	Input,
	Modal,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalHeader,
} from "@nextui-org/react"
import { formatCurrency } from "@/types/finance"
import type { DebtView, GenerationFormState } from "./debt-types"

type GenerationModalProps = {
	isOpen: boolean
	onClose: () => void
	loading: boolean
	form: GenerationFormState
	debt: DebtView | null
	onChange: (form: GenerationFormState) => void
	onSubmit: () => void
}

export function GenerationModal({
	isOpen,
	onClose,
	loading,
	form,
	debt,
	onChange,
	onSubmit,
}: GenerationModalProps) {
	return (
		<Modal isOpen={isOpen} onClose={onClose} size="md">
			<ModalContent>
				<ModalHeader>Gerar parcelas futuras</ModalHeader>
				<ModalBody className="gap-4">
					<p className="text-sm text-slate-500">
						Saldo a parcelar: {formatCurrency(debt?.outstandingAmount ?? 0)}
					</p>
					<Input
						label="Quantidade de parcelas"
						type="number"
						min={1}
						max={120}
						value={form.installmentCount}
						onValueChange={(installmentCount) =>
							onChange({ ...form, installmentCount })
						}
						isRequired
					/>
					<Input
						label="Vencimento da primeira parcela"
						type="date"
						value={form.firstDueDate}
						onValueChange={(firstDueDate) =>
							onChange({ ...form, firstDueDate })
						}
						isRequired
					/>
					<p className="text-xs text-slate-500">
						As parcelas são mensais e serão criadas em lote. Após a geração,
						entram no orçamento e nas projeções.
					</p>
				</ModalBody>
				<ModalFooter>
					<Button variant="flat" onPress={onClose}>
						Cancelar
					</Button>
					<Button color="primary" isLoading={loading} onPress={onSubmit}>
						Gerar parcelas
					</Button>
				</ModalFooter>
			</ModalContent>
		</Modal>
	)
}
