"use client"

import { useState } from "react"
import {
	Modal,
	ModalContent,
	ModalHeader,
	ModalBody,
	ModalFooter,
	Button,
	Input,
	Select,
	SelectItem,
	SelectSection,
	Switch,
} from "@nextui-org/react"
import {
	createEvent,
	createTransfer,
	type CreateEventInput,
} from "@/features/events"
import type { AccountWithBalance } from "@/features/accounts"
import type { CategoryWithGroup } from "@/features/categories"
import { toast } from "react-toastify"
import { dateFromInput, formatCurrency, formatDateInput } from "@/types/finance"

interface EventFormProps {
	isOpen: boolean
	onClose: () => void
	onSuccess: () => void
	accounts: AccountWithBalance[]
	categories: CategoryWithGroup[]
}

export function EventForm({
	isOpen,
	onClose,
	onSuccess,
	accounts,
	categories,
}: EventFormProps) {
	const [loading, setLoading] = useState(false)
	const [createAnother, setCreateAnother] = useState(false)
	const [formData, setFormData] = useState<{
		accountId: string
		destinationAccountId: string
		categoryId: string
		description: string
		amount: string
		type: "INCOME" | "EXPENSE" | "INVESTMENT" | "TRANSFER"
		costType: "RECURRENT" | "EXCEPTIONAL"
		priority: "REQUIRED" | "IMPORTANT" | "OPTIONAL"
		date: string
		isRecurring: boolean
		recurrenceFrequency: string
	}>({
		accountId: accounts[0]?.id || "",
		destinationAccountId: "",
		categoryId: "",
		description: "",
		amount: "",
		type: "EXPENSE",
		costType: "RECURRENT",
		priority: "IMPORTANT",
		date: formatDateInput(new Date()),
		isRecurring: false,
		recurrenceFrequency: "MONTHLY",
	})
	const selectedAccount = accounts.find(
		(account) => account.id === formData.accountId,
	)
	const amountCents = (() => {
		const [wholePart, decimalPart = ""] = formData.amount.replace(",", ".").split(".")
		const wholeCents = Number(wholePart) * 100
		const decimalCents = Number(decimalPart.padEnd(2, "0").slice(0, 2))
		return Number.isFinite(wholeCents) && Number.isFinite(decimalCents)
			? wholeCents + decimalCents
			: 0
	})()
	const willMakeAccountNegative =
		formData.type !== "INCOME" &&
		amountCents > 0 &&
		selectedAccount !== undefined &&
		selectedAccount.currentBalance - amountCents < 0

	const handleSubmit = async () => {
		if (
			!formData.accountId ||
			!formData.description ||
			!formData.amount ||
			(formData.type !== "TRANSFER" && !formData.categoryId) ||
			(formData.type === "TRANSFER" && !formData.destinationAccountId)
		) {
			toast.error("Por favor, preencha todos os campos obrigatórios")
			return
		}

		setLoading(true)

		if (formData.type === "TRANSFER") {
			const result = await createTransfer({
				fromAccountId: formData.accountId,
				toAccountId: formData.destinationAccountId,
				description: formData.description,
				amount: parseFloat(formData.amount),
				date: dateFromInput(formData.date),
			})
			if (result.success) {
				toast.success("Transferência criada com sucesso")
				if (result.warning) toast.warning(result.warning)
				onSuccess()
				setFormData({
					accountId: createAnother ? formData.accountId : accounts[0]?.id || "",
					destinationAccountId: createAnother
						? formData.destinationAccountId
						: "",
					categoryId: createAnother ? formData.categoryId : "",
					description: "",
					amount: "",
					type: createAnother ? formData.type : "EXPENSE",
					costType: "RECURRENT",
					priority: "IMPORTANT",
					date: createAnother ? formData.date : formatDateInput(new Date()),
					isRecurring: false,
					recurrenceFrequency: "MONTHLY",
				})
				if (!createAnother) {
					setCreateAnother(false)
					onClose()
				}
			} else toast.error(result.error)
			setLoading(false)
			return
		}

		const input: CreateEventInput = {
			accountId: formData.accountId,
			categoryId: formData.categoryId,
			description: formData.description,
			amount: parseFloat(formData.amount),
			type: formData.type,
			costType: formData.type === "EXPENSE" ? formData.costType : undefined,
			priority: formData.priority,
			date: dateFromInput(formData.date),
			isRecurring: formData.isRecurring,
			recurrenceFrequency: formData.isRecurring
				? (formData.recurrenceFrequency as CreateEventInput["recurrenceFrequency"])
				: undefined,
		}

		const result = await createEvent(input)

		if (result.success) {
			toast.success("Evento criado com sucesso")
			onSuccess()
			// Reset form
			setFormData({
				accountId: createAnother ? formData.accountId : accounts[0]?.id || "",
				destinationAccountId: createAnother
					? formData.destinationAccountId
					: "",
				categoryId: createAnother ? formData.categoryId : "",
				description: "",
				amount: "",
				type: createAnother ? formData.type : "EXPENSE",
				costType: "RECURRENT",
				priority: "IMPORTANT",
				date: createAnother ? formData.date : formatDateInput(new Date()),
				isRecurring: false,
				recurrenceFrequency: "MONTHLY",
			})
			if (!createAnother) {
				setCreateAnother(false)
				onClose()
			}
		} else {
			toast.error(result.error)
		}

		setLoading(false)
	}

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			size="lg"
			scrollBehavior="inside"
			classNames={{
				base: "mx-2 sm:mx-0",
				body: "py-4",
			}}
		>
			<ModalContent>
				<ModalHeader className="text-lg sm:text-xl">Novo Evento</ModalHeader>
				<ModalBody className="gap-3 sm:gap-4">
					<Select
						label="Conta"
						size="sm"
						selectedKeys={formData.accountId ? [formData.accountId] : []}
						onSelectionChange={(keys) => {
							const value = Array.from(keys)[0] as string
							setFormData({ ...formData, accountId: value })
						}}
						isRequired
						classNames={{
							label: "text-sm",
						}}
					>
						{accounts.map((account) => (
							<SelectItem key={account.id} textValue={account.name}>
								{account.name} (
								{account.type === "BANK"
									? "Banco"
									: account.type === "CASH"
										? "Dinheiro"
										: "Investimento"}
								)
							</SelectItem>
						))}
					</Select>
					{selectedAccount && (
						<p className="text-xs text-slate-500 dark:text-slate-400">
							Saldo atual: {formatCurrency(selectedAccount.currentBalance)}
						</p>
					)}

					<Input
						label="Descrição"
						size="sm"
						placeholder="Ex: Aluguel mensal"
						value={formData.description}
						onValueChange={(value) =>
							setFormData({ ...formData, description: value })
						}
						isRequired
						classNames={{
							label: "text-sm",
						}}
					/>

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
						<Input
							label="Valor"
							size="sm"
							type="number"
							placeholder="0,00"
							startContent={<span className="text-gray-500 text-sm">R$</span>}
							value={formData.amount}
							onValueChange={(value) =>
								setFormData({ ...formData, amount: value })
							}
							isRequired
							classNames={{
								label: "text-sm",
							}}
						/>

						<Select
							label="Tipo"
							size="sm"
							selectedKeys={[formData.type]}
							onSelectionChange={(keys) => {
								const value = Array.from(keys)[0] as
									"INCOME" | "EXPENSE" | "INVESTMENT" | "TRANSFER"
								setFormData({
									...formData,
									type: value,
									categoryId: "",
									destinationAccountId: "",
								})
							}}
							isRequired
							classNames={{
								label: "text-sm",
							}}
						>
							<SelectItem key="INCOME" textValue="Receita">
								Receita (+)
							</SelectItem>
							<SelectItem key="EXPENSE" textValue="Despesa">
								Despesa (-)
							</SelectItem>
							<SelectItem key="INVESTMENT" textValue="Investimento">
								Investimento (-)
							</SelectItem>
							<SelectItem key="TRANSFER" textValue="Transferência">
								Transferência
							</SelectItem>
						</Select>
					</div>

					{willMakeAccountNegative && (
						<p className="text-xs text-amber-600 dark:text-amber-400">
							Esta operação deixará a conta com saldo negativo.
						</p>
					)}

					{formData.type === "TRANSFER" && (
						<div className="space-y-2">
							<Select
								label="Conta de destino"
								size="sm"
								selectedKeys={
									formData.destinationAccountId
										? [formData.destinationAccountId]
										: []
								}
								onSelectionChange={(keys) =>
									setFormData({
										...formData,
										destinationAccountId: String(Array.from(keys)[0] ?? ""),
									})
								}
								isRequired
							>
								{accounts
									.filter((account) => account.id !== formData.accountId)
									.map((account) => (
										<SelectItem key={account.id}>{account.name}</SelectItem>
									))}
							</Select>
						</div>
					)}

					{formData.type !== "TRANSFER" && (
						<>
							<Select
								label="Categoria"
								size="sm"
								selectedKeys={formData.categoryId ? [formData.categoryId] : []}
								onSelectionChange={(keys) =>
									setFormData({
										...formData,
										categoryId: String(Array.from(keys)[0] ?? ""),
									})
								}
								isRequired
								isDisabled={categories.length === 0}
								description={
									categories.length === 0
										? "Cadastre uma categoria compatível antes de criar o evento."
										: undefined
								}
							>
								{Array.from(
									new Map(
										categories
											.filter((category) =>
												formData.type === "INCOME"
													? category.categoryGroup.type === "INCOME"
													: formData.type === "INVESTMENT"
														? category.categoryGroup.type === "INVESTMENT"
														: ["ESSENTIAL", "LIFESTYLE"].includes(
																category.categoryGroup.type,
															),
											)
											.map((category) => [
												category.categoryGroup.id,
												category.categoryGroup,
											]),
									).values(),
								).map((group) => (
									<SelectSection key={group.id} title={group.name}>
										{categories
											.filter(
												(category) => category.categoryGroupId === group.id,
											)
											.map((category) => (
												<SelectItem key={category.id}>
													{category.name}
												</SelectItem>
											))}
									</SelectSection>
								))}
							</Select>
							{formData.type === "EXPENSE" && (
								<Select
									label="Tipo de Custo"
									size="sm"
									selectedKeys={[formData.costType]}
									onSelectionChange={(keys) => {
										const value = Array.from(keys)[0] as
											"RECURRENT" | "EXCEPTIONAL"
										setFormData({ ...formData, costType: value })
									}}
									description="Custos recorrentes são para planejamento de longo prazo."
									classNames={{ label: "text-sm", description: "text-xs" }}
								>
									<SelectItem key="RECURRENT" textValue="Recorrente">
										Recorrente (aluguel, contas)
									</SelectItem>
									<SelectItem key="EXCEPTIONAL" textValue="Excepcional">
										Excepcional (viagens, emergências)
									</SelectItem>
								</Select>
							)}
						</>
					)}

					<Input
						label="Data"
						size="sm"
						type="date"
						value={formData.date}
						onValueChange={(value) => setFormData({ ...formData, date: value })}
						isRequired
						classNames={{
							label: "text-sm",
						}}
					/>

					{formData.type !== "TRANSFER" && (
						<div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 sm:p-4">
							<div>
								<p className="font-medium text-sm sm:text-base text-slate-900 dark:text-white">
									Evento Recorrente
								</p>
								<p className="text-xs sm:text-sm text-slate-500">
									Repete em uma agenda
								</p>
							</div>
							<Switch
								size="sm"
								isSelected={formData.isRecurring}
								onValueChange={(value) =>
									setFormData({ ...formData, isRecurring: value })
								}
							/>
						</div>
					)}

					{formData.type !== "TRANSFER" && formData.isRecurring && (
						<Select
							label="Frequência"
							size="sm"
							selectedKeys={[formData.recurrenceFrequency]}
							onSelectionChange={(keys) => {
								const value = Array.from(keys)[0] as string
								setFormData({ ...formData, recurrenceFrequency: value })
							}}
							classNames={{
								label: "text-sm",
							}}
						>
							<SelectItem key="DAILY">Diário</SelectItem>
							<SelectItem key="WEEKLY">Semanal</SelectItem>
							<SelectItem key="BIWEEKLY">Quinzenal</SelectItem>
							<SelectItem key="MONTHLY">Mensal</SelectItem>
							<SelectItem key="YEARLY">Anual</SelectItem>
						</Select>
					)}

					<div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
						<div>
							<p className="font-medium text-sm text-slate-900 dark:text-white">
								Criar um novo evento
							</p>
							<p className="text-xs text-slate-500">
								Mantém este formulário aberto após salvar.
							</p>
						</div>
						<Switch
							size="sm"
							isSelected={createAnother}
							onValueChange={setCreateAnother}
						/>
					</div>
				</ModalBody>
				<ModalFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
					<Button
						variant="flat"
						onPress={onClose}
						className="w-full sm:w-auto order-2 sm:order-1"
					>
						Cancelar
					</Button>
					<Button
						color="primary"
						onPress={handleSubmit}
						isLoading={loading}
						className="w-full sm:w-auto order-1 sm:order-2"
					>
						Criar Evento
					</Button>
				</ModalFooter>
			</ModalContent>
		</Modal>
	)
}
