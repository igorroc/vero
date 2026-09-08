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
import type { Dispatch, SetStateAction } from "react"
import type { AccountWithBalance } from "@/features/accounts"

export interface InvestmentPlanCreationFormData {
	accountId: string
	name: string
	amount: string
	frequency: "WEEKLY" | "BIWEEKLY" | "MONTHLY" | "YEARLY"
	dayOfExecution: string
	startDate: string
	endDate: string
}

interface InvestmentPlanCreationModalProps {
	isOpen: boolean
	onClose: () => void
	accounts: AccountWithBalance[]
	formData: InvestmentPlanCreationFormData
	setFormData: Dispatch<SetStateAction<InvestmentPlanCreationFormData>>
	onCreate: () => void
	isLoading: boolean
}

export function InvestmentPlanCreationModal({
	isOpen,
	onClose,
	accounts,
	formData,
	setFormData,
	onCreate,
	isLoading,
}: InvestmentPlanCreationModalProps) {
	return (
		<Modal isOpen={isOpen} onClose={onClose} size="lg">
			<ModalContent>
				<ModalHeader>Novo Plano de Investimento</ModalHeader>
				<ModalBody className="gap-4">
					<Select
						label="Conta de Investimento"
						selectedKeys={formData.accountId ? [formData.accountId] : []}
						onSelectionChange={(keys) => {
							const value = Array.from(keys)[0] as string
							setFormData({ ...formData, accountId: value })
						}}
						isRequired
					>
						{accounts.map((account) => (
							<SelectItem key={account.id} textValue={account.name}>
								{account.name}
							</SelectItem>
						))}
					</Select>

					<Input label="Nome do Plano" placeholder="Ex: Reserva de Emergência" value={formData.name} onValueChange={(value) => setFormData({ ...formData, name: value })} isRequired />

					<div className="grid grid-cols-2 gap-4">
						<Input label="Valor" type="number" placeholder="0,00" startContent={<span className="text-gray-500">R$</span>} value={formData.amount} onValueChange={(value) => setFormData({ ...formData, amount: value })} isRequired />
						<Select label="Frequência" selectedKeys={[formData.frequency]} onSelectionChange={(keys) => {
							const value = Array.from(keys)[0] as typeof formData.frequency
							setFormData({ ...formData, frequency: value })
						}}>
							<SelectItem key="WEEKLY">Semanal</SelectItem>
							<SelectItem key="BIWEEKLY">Quinzenal</SelectItem>
							<SelectItem key="MONTHLY">Mensal</SelectItem>
							<SelectItem key="YEARLY">Anual</SelectItem>
						</Select>
					</div>

					<Input label="Dia de Execução" type="number" min={1} max={31} placeholder="1" value={formData.dayOfExecution} onValueChange={(value) => setFormData({ ...formData, dayOfExecution: value })} description="Dia do mês (1-31) ou dia da semana (1-7 para semanal)" />

					<div className="grid grid-cols-2 gap-4">
						<Input label="Data de Início" type="date" value={formData.startDate} onValueChange={(value) => setFormData({ ...formData, startDate: value })} isRequired />
						<Input label="Data de Término (Opcional)" type="date" value={formData.endDate} onValueChange={(value) => setFormData({ ...formData, endDate: value })} description="Deixe vazio para indefinido" />
					</div>
				</ModalBody>
				<ModalFooter>
					<Button variant="flat" onPress={onClose}>Cancelar</Button>
					<Button color="primary" onPress={onCreate} isLoading={isLoading}>Criar Plano</Button>
				</ModalFooter>
			</ModalContent>
		</Modal>
	)
}
