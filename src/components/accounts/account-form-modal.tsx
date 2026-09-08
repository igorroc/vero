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

export interface AccountFormData {
	name: string
	type: AccountWithBalance["type"]
	initialBalance: string
}

interface AccountFormModalProps {
	isOpen: boolean
	mode: "create" | "edit"
	data: AccountFormData | null
	isLoading: boolean
	onClose: () => void
	onChange: (data: AccountFormData) => void
	onSubmit: () => void
}

export function AccountFormModal({
	isOpen,
	mode,
	data,
	isLoading,
	onClose,
	onChange,
	onSubmit,
}: AccountFormModalProps) {
	const isEditing = mode === "edit"
	const formData = data ?? { name: "", type: "BANK", initialBalance: "" }

	return (
		<Modal isOpen={isOpen} onClose={onClose}>
			<ModalContent>
				<ModalHeader>{isEditing ? "Editar Conta" : "Nova Conta"}</ModalHeader>
				<ModalBody className="gap-4">
					<Input
						label="Nome da Conta"
						placeholder="Ex: Conta Corrente Principal"
						value={formData.name}
						onValueChange={(name) => onChange({ ...formData, name })}
						isRequired
					/>
					<Select
						label="Tipo de Conta"
						selectedKeys={[formData.type]}
						onSelectionChange={(keys) =>
							onChange({
								...formData,
								type: Array.from(keys)[0] as AccountFormData["type"],
							})
						}
					>
						<SelectItem key="BANK">Conta Bancária</SelectItem>
						<SelectItem key="CASH">Dinheiro em Espécie</SelectItem>
						<SelectItem key="INVESTMENT">Conta de Investimento</SelectItem>
					</Select>
					<Input
						label="Saldo Inicial"
						type="number"
						placeholder="0,00"
						startContent={<span className="text-gray-500">R$</span>}
						value={formData.initialBalance}
						onValueChange={(initialBalance) =>
							onChange({ ...formData, initialBalance })
						}
						description={
							isEditing
								? "Saldo inicial nesta conta (ajusta o saldo atual proporcionalmente)"
								: "Saldo atual nesta conta"
						}
					/>
				</ModalBody>
				<ModalFooter>
					<Button variant="flat" onPress={onClose}>
						Cancelar
					</Button>
					<Button color="primary" onPress={onSubmit} isLoading={isLoading}>
						{isEditing ? "Salvar Alterações" : "Criar Conta"}
					</Button>
				</ModalFooter>
			</ModalContent>
		</Modal>
	)
}
