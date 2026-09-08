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
import {
	categoryGroupTypeLabels,
	type CategoryGroupWithCategories,
} from "@/features/categories"

export interface CategoryFormData {
	id?: string
	name: string
	categoryGroupId: string
}

interface CategoryFormModalProps {
	formData: CategoryFormData
	groups: CategoryGroupWithCategories[]
	isOpen: boolean
	isSaving: boolean
	onClose: () => void
	onSave: () => void
	onFormDataChange: (formData: CategoryFormData) => void
}

export function CategoryFormModal({
	formData,
	groups,
	isOpen,
	isSaving,
	onClose,
	onSave,
	onFormDataChange,
}: CategoryFormModalProps) {
	return (
		<Modal isOpen={isOpen} onClose={onClose}>
			<ModalContent>
				<ModalHeader>
					{formData.id ? "Editar categoria" : "Nova categoria"}
				</ModalHeader>
				<ModalBody>
					<Input
						label="Nome"
						value={formData.name}
						onValueChange={(name) => onFormDataChange({ ...formData, name })}
						isRequired
					/>
					<Select
						label="Grupo"
						selectedKeys={
							formData.categoryGroupId ? [formData.categoryGroupId] : []
						}
						onSelectionChange={(keys) =>
							onFormDataChange({
								...formData,
								categoryGroupId: String(Array.from(keys)[0] ?? ""),
							})
						}
						isRequired
					>
						{groups.map((group) => (
							<SelectItem key={group.id} textValue={group.name}>
								{categoryGroupTypeLabels[group.type]}: {group.name}
							</SelectItem>
						))}
					</Select>
				</ModalBody>
				<ModalFooter>
					<Button variant="flat" onPress={onClose}>
						Cancelar
					</Button>
					<Button color="primary" onPress={onSave} isLoading={isSaving}>
						Salvar
					</Button>
				</ModalFooter>
			</ModalContent>
		</Modal>
	)
}
