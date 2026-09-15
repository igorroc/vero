"use client"

import { useEffect, useRef, useState } from "react"
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
	Switch,
} from "@nextui-org/react"
import {
	createEvent,
	createTransfer,
	type CreateEventInput,
} from "@/features/events"
import type { Event } from "@prisma/client"
import type { AccountWithBalance } from "@/features/accounts"
import type { CategoryWithGroup } from "@/features/categories"
import { toast } from "react-toastify"
import {
	dateFromInput,
	dollarsToCents,
	formatCurrency,
	startOfDay,
} from "@/types/finance"
import { useEventFormStore } from "@/stores/event-form-store"
import { EventCategorySelect } from "./event-category-select"

interface EventFormProps {
	isOpen: boolean
	onClose: () => void
	onSuccess: (event: Event, optimisticEventId?: string) => void
	onOptimisticCreate?: (event: Event) => void
	onOptimisticError?: (eventId: string) => void
	accounts: AccountWithBalance[]
	categories: CategoryWithGroup[]
}

export function EventForm({
	isOpen,
	onClose,
	onSuccess,
	onOptimisticCreate,
	onOptimisticError,
	accounts,
	categories,
}: EventFormProps) {
	const [loading, setLoading] = useState(false)
	const [createAnother, setCreateAnother] = useState(false)
	const formData = useEventFormStore((state) => state.formData)
	const setFormData = useEventFormStore((state) => state.setFormData)
	const wasOpen = useRef(isOpen)
	const eventCategories = categories.filter(
		(category) => category.categoryGroupId !== "debts",
	)
	useEffect(() => {
		if (!formData.accountId && accounts[0]) {
			setFormData({ ...formData, accountId: accounts[0].id })
		}
	}, [accounts, formData, setFormData])
	useEffect(() => {
		if (wasOpen.current && !isOpen && (formData.description || formData.amount)) {
			setFormData({ ...formData, description: "", amount: "" })
		}
		wasOpen.current = isOpen
	}, [formData, isOpen, setFormData])
	const selectedAccount = accounts.find(
		(account) => account.id === formData.accountId,
	)
	const amountCents = (() => {
		const [wholePart, decimalPart = ""] = formData.amount
			.replace(",", ".")
			.split(".")
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
	const notifyOptimisticCreate = (event: Event) => {
		onOptimisticCreate?.(event)
		return event.id
	}
	const notifyOptimisticError = (eventId: string) =>
		onOptimisticError?.(eventId)

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
			const date = dateFromInput(formData.date)
			const optimisticEventId = notifyOptimisticCreate(
				buildOptimisticEvent({
					accountId: formData.accountId,
					destinationAccountId: formData.destinationAccountId,
					description: formData.description,
					amount: -dollarsToCents(Math.abs(parseFloat(formData.amount))),
					type: "TRANSFER",
					status: "CONFIRMED",
					date,
				}),
			)
			const result = await createTransfer({
				fromAccountId: formData.accountId,
				toAccountId: formData.destinationAccountId,
				description: formData.description,
				amount: parseFloat(formData.amount),
				date,
			})
			if (result.success) {
				toast.success("Transferência criada com sucesso")
				if (result.warning) toast.warning(result.warning)
				onSuccess(result.event, optimisticEventId)
				setFormData({ ...formData, description: "", amount: "" })
				if (!createAnother) {
					setCreateAnother(false)
					onClose()
				}
			} else {
				notifyOptimisticError(optimisticEventId)
				toast.error(result.error)
			}
			setLoading(false)
			return
		}

		const input: CreateEventInput = {
			accountId: formData.accountId,
			categoryId: formData.categoryId,
			description: formData.description,
			amount: parseFloat(formData.amount),
			type: formData.type,
			priority: formData.priority,
			date: dateFromInput(formData.date),
		}
		const optimisticEventId = notifyOptimisticCreate(
			buildOptimisticEvent({
				accountId: input.accountId,
				categoryId: input.categoryId,
				description: input.description,
				amount:
					input.type === "INCOME"
						? dollarsToCents(Math.abs(input.amount))
						: -dollarsToCents(Math.abs(input.amount)),
				type: input.type,
				status:
					startOfDay(input.date).getTime() <= startOfDay(new Date()).getTime()
						? "CONFIRMED"
						: "PLANNED",
				date: input.date,
			}),
		)

		const result = await createEvent(input)

		if (result.success) {
			toast.success("Evento criado com sucesso")
			onSuccess(result.event, optimisticEventId)
			setFormData({ ...formData, description: "", amount: "" })
			if (!createAnother) {
				setCreateAnother(false)
				onClose()
			}
		} else {
			notifyOptimisticError(optimisticEventId)
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
				<ModalHeader className="text-lg sm:text-xl">
					Novo Lançamento
				</ModalHeader>
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
							<EventCategorySelect
								categories={eventCategories}
								type={formData.type}
								categoryId={formData.categoryId}
								onSelectionChange={(categoryId) =>
									setFormData({ ...formData, categoryId })
								}
								description={
									eventCategories.length === 0
										? "Cadastre uma categoria compatível antes de criar o evento."
										: undefined
								}
							/>
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

					<div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
						<div>
							<p className="font-medium text-sm text-slate-900 dark:text-white">
								Criar um novo lançamento
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
						Criar Lançamento
					</Button>
				</ModalFooter>
			</ModalContent>
		</Modal>
	)
}

function buildOptimisticEvent({
	accountId,
	destinationAccountId = null,
	categoryId = null,
	description,
	amount,
	type,
	status,
	date,
}: OptimisticEventInput): Event {
	const now = new Date()
	return {
		id: `optimistic-${now.getTime()}`,
		userId: "",
		accountId,
		destinationAccountId,
		categoryId,
		description,
		amount,
		type,
		costType: type === "EXPENSE" ? "RECURRENT" : null,
		status,
		priority: "IMPORTANT",
		date,
		isRecurrenceTemplate: false,
		recurrenceFrequency: null,
		recurrenceEndDate: null,
		recurrenceId: null,
		createdAt: now,
		updatedAt: now,
	}
}

type OptimisticEventInput = Pick<
	Event,
	| "accountId"
	| "description"
	| "amount"
	| "type"
	| "status"
	| "date"
> & {
	destinationAccountId?: string | null
	categoryId?: string | null
}
