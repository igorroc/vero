"use client"

import {
	Button,
	Modal,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalHeader,
} from "@nextui-org/react"

interface BudgetCreateModalProps {
	isOpen: boolean
	isSaving: boolean
	monthLabel: string
	onClose: () => void
	onCreate: (copyPrevious: boolean) => void
}

export function BudgetCreateModal({
	isOpen,
	isSaving,
	monthLabel,
	onClose,
	onCreate,
}: BudgetCreateModalProps) {
	return (
		<Modal isOpen={isOpen} onClose={onClose}>
			<ModalContent>
				<ModalHeader>Criar orçamento</ModalHeader>
				<ModalBody>
					<p>Escolha como iniciar o orçamento de {monthLabel}.</p>
				</ModalBody>
				<ModalFooter>
					<Button
						variant="flat"
						onPress={() => onCreate(false)}
						isLoading={isSaving}
					>
						Em branco
					</Button>
					<Button
						color="primary"
						onPress={() => onCreate(true)}
						isLoading={isSaving}
					>
						Copiar mês anterior
					</Button>
				</ModalFooter>
			</ModalContent>
		</Modal>
	)
}
