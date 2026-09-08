"use client"

import { ArrowRightLeft } from "lucide-react"

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

export interface TransferFormData {
	fromAccountId: string
	fromAccountName: string
	toAccountId: string
	amount: string
	description: string
	date: string
}

interface TransferModalProps {
	isOpen: boolean
	data: TransferFormData | null
	destinationAccounts: AccountWithBalance[]
	isLoading: boolean
	onClose: () => void
	onChange: (data: TransferFormData) => void
	onSubmit: () => void
}

export function TransferModal({
	isOpen,
	data,
	destinationAccounts,
	isLoading,
	onClose,
	onChange,
	onSubmit,
}: TransferModalProps) {
	const transfer = data ?? {
		fromAccountId: "",
		fromAccountName: "",
		toAccountId: "",
		amount: "",
		description: "",
		date: "",
	}

	return (
		<Modal isOpen={isOpen} onClose={onClose}>
			<ModalContent>
				<ModalHeader>
					<div className="flex items-center gap-2">
						<ArrowRightLeft className="w-5 h-5 text-blue-600" />
						<span>Transferir entre contas</span>
					</div>
				</ModalHeader>
				<ModalBody className="gap-4">
					<div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
						<p className="text-sm text-purple-700 dark:text-purple-300">
							Saindo de: <strong>{transfer.fromAccountName}</strong>
						</p>
					</div>
					<Select
						label="Conta de destino"
						placeholder="Selecione a conta para receber o valor"
						selectedKeys={transfer.toAccountId ? [transfer.toAccountId] : []}
						onSelectionChange={(keys) =>
							onChange({
								...transfer,
								toAccountId: Array.from(keys)[0] as string,
							})
						}
						isRequired
					>
						{destinationAccounts.map((account) => (
							<SelectItem key={account.id} textValue={account.name}>
								<div className="flex justify-between items-center w-full">
									<span>{account.name}</span>
									<span className="text-xs text-slate-500">
										{account.type === "BANK"
											? "Banco"
											: account.type === "CASH"
												? "Dinheiro"
												: "Investimento"}
									</span>
								</div>
							</SelectItem>
						))}
					</Select>
					<Input
						label="Valor da transferência"
						type="number"
						placeholder="0,00"
						startContent={<span className="text-gray-500">R$</span>}
						value={transfer.amount}
						onValueChange={(amount) => onChange({ ...transfer, amount })}
						isRequired
					/>
					<Input
						label="Descrição"
						placeholder="Ex: Reserva para conta corrente"
						value={transfer.description}
						onValueChange={(description) =>
							onChange({ ...transfer, description })
						}
						isRequired
					/>
					<Input
						label="Data"
						type="date"
						value={transfer.date}
						onValueChange={(date) => onChange({ ...transfer, date })}
						isRequired
					/>
				</ModalBody>
				<ModalFooter>
					<Button variant="flat" onPress={onClose}>
						Cancelar
					</Button>
					<Button
						color="secondary"
						onPress={onSubmit}
						isLoading={isLoading}
						startContent={<ArrowRightLeft className="w-4 h-4" />}
					>
						Transferir
					</Button>
				</ModalFooter>
			</ModalContent>
		</Modal>
	)
}
