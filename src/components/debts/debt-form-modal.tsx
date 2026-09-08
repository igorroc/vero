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
import type { CategoryWithGroup } from "@/features/categories"
import type { DebtFormState } from "./debt-types"

type DebtFormModalProps = {
	isOpen: boolean
	onClose: () => void
	loading: boolean
	form: DebtFormState
	categories: CategoryWithGroup[]
	onChange: (form: DebtFormState) => void
	onSubmit: () => void
}

export function DebtFormModal({
	isOpen,
	onClose,
	loading,
	form,
	categories,
	onChange,
	onSubmit,
}: DebtFormModalProps) {
	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			size="lg"
			classNames={{ base: "mx-2 sm:mx-0" }}
		>
			<ModalContent>
				<ModalHeader>Nova Dívida</ModalHeader>
				<ModalBody className="gap-4">
					<Input
						label="Credor"
						value={form.creditor}
						onValueChange={(creditor) => onChange({ ...form, creditor })}
						isRequired
					/>
					<Input
						label="Descrição"
						placeholder="Ex: Empréstimo pessoal"
						value={form.description}
						onValueChange={(description) => onChange({ ...form, description })}
						isRequired
					/>
					<Select
						label="Categoria de dívida"
						selectedKeys={form.categoryId ? [form.categoryId] : []}
						onSelectionChange={(keys) =>
							onChange({
								...form,
								categoryId: String(Array.from(keys)[0] ?? ""),
							})
						}
						isRequired
						isDisabled={categories.length === 0}
						description={
							categories.length === 0
								? "Cadastre uma categoria no grupo Dívidas antes de continuar."
								: "Exibe apenas categorias do grupo Dívidas."
						}
					>
						{categories.map((category) => (
							<SelectItem key={category.id}>{category.name}</SelectItem>
						))}
					</Select>
					<Input
						label="Valor atual da dívida"
						type="number"
						startContent="R$"
						value={form.totalAmount}
						onValueChange={(totalAmount) => onChange({ ...form, totalAmount })}
						isRequired
					/>
					<p className="text-xs text-slate-500">
						Depois de cadastrar, gere as parcelas futuras quando estiver pronto
						para projetá-las no orçamento e no fluxo de caixa.
					</p>
				</ModalBody>
				<ModalFooter>
					<Button variant="flat" onPress={onClose}>
						Cancelar
					</Button>
					<Button
						color="primary"
						isLoading={loading}
						onPress={onSubmit}
						isDisabled={categories.length === 0}
					>
						Criar dívida
					</Button>
				</ModalFooter>
			</ModalContent>
		</Modal>
	)
}
