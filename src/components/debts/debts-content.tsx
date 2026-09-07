"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
	Button,
	Chip,
	Input,
	Modal,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalHeader,
	Select,
	SelectItem,
	Spinner,
	useDisclosure,
} from "@nextui-org/react"
import { CreditCard, Plus, ReceiptText } from "lucide-react"
import { toast } from "react-toastify"
import {
	getAccountBalances,
	type AccountWithBalance,
} from "@/features/accounts"
import { getCategories, type CategoryWithGroup } from "@/features/categories"
import {
	createDebt,
	generateDebtInstallments,
	getDebt,
	getDebts,
	registerDebtPayment,
	type DebtWithDetails,
} from "@/features/debts"
import { dateFromInput, formatCurrency, formatDateInput } from "@/types/finance"
import { StatCard } from "@/components/ui/stat-card"

type DebtView = DebtWithDetails & { outstandingAmount: number }
type DebtFormState = {
	creditor: string
	description: string
	categoryId: string
	totalAmount: string
}
type PaymentFormState = { accountId: string; amount: string; date: string }
type GenerationFormState = { installmentCount: string; firstDueDate: string }

export function DebtsContent({ debtId }: { debtId?: string }) {
	const [debts, setDebts] = useState<DebtView[]>([])
	const [accounts, setAccounts] = useState<AccountWithBalance[]>([])
	const [categories, setCategories] = useState<CategoryWithGroup[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const createModal = useDisclosure()
	const paymentModal = useDisclosure()
	const generationModal = useDisclosure()
	const [selectedInstallment, setSelectedInstallment] = useState<
		DebtView["installments"][number] | null
	>(null)
	const [selectedDebt, setSelectedDebt] = useState<DebtView | null>(null)
	const [formLoading, setFormLoading] = useState(false)
	const [debtForm, setDebtForm] = useState({
		creditor: "",
		description: "",
		categoryId: "",
		totalAmount: "",
	})
	const [generationForm, setGenerationForm] = useState<GenerationFormState>({
		installmentCount: "",
		firstDueDate: formatDateInput(new Date()),
	})
	const [paymentForm, setPaymentForm] = useState({
		accountId: "",
		amount: "",
		date: formatDateInput(new Date()),
	})

	const loadData = async () => {
		setLoading(true)
		setError(null)
		const [debtsResult, accountsResult, categoriesResult] = await Promise.all([
			debtId ? getDebt(debtId) : getDebts(),
			getAccountBalances(),
			getCategories(),
		])
		if (debtsResult.success) {
			if (debtId && "debt" in debtsResult)
				setDebts([debtsResult.debt as DebtView])
			else if (!debtId && "debts" in debtsResult)
				setDebts(debtsResult.debts as DebtView[])
		} else setError(debtsResult.error)
		if (accountsResult.success) {
			setAccounts(accountsResult.accounts)
			setPaymentForm((current) => ({
				...current,
				accountId: current.accountId || accountsResult.accounts[0]?.id || "",
			}))
		}
		if (categoriesResult.success) {
			const debtCategories = categoriesResult.categories.filter(
				(category) => category.categoryGroupId === "debts",
			)
			setCategories(debtCategories)
			setDebtForm((current) => ({
				...current,
				categoryId: current.categoryId || debtCategories[0]?.id || "",
			}))
		}
		setLoading(false)
	}

	useEffect(() => {
		void loadData()
	}, [debtId])

	const handleCreate = async () => {
		if (
			!debtForm.creditor ||
			!debtForm.description ||
			!debtForm.categoryId ||
			!debtForm.totalAmount
		) {
			toast.error("Preencha todos os campos obrigatórios")
			return
		}
		setFormLoading(true)
		const result = await createDebt({
			...debtForm,
			totalAmount: Number(debtForm.totalAmount.replace(",", ".")),
		})
		if (result.success) {
			toast.success("Dívida cadastrada")
			createModal.onClose()
			setDebtForm({
				creditor: "",
				description: "",
				categoryId: categories[0]?.id || "",
				totalAmount: "",
			})
			await loadData()
		} else toast.error(result.error)
		setFormLoading(false)
	}

	const openGeneration = (debt: DebtView) => {
		setSelectedDebt(debt)
		setGenerationForm({
			installmentCount: "",
			firstDueDate: formatDateInput(new Date()),
		})
		generationModal.onOpen()
	}

	const handleGeneration = async () => {
		if (!selectedDebt || !generationForm.installmentCount) return
		setFormLoading(true)
		const result = await generateDebtInstallments({
			debtId: selectedDebt.id,
			installmentCount: Number(generationForm.installmentCount),
			firstDueDate: dateFromInput(generationForm.firstDueDate),
		})
		if (result.success) {
			toast.success(`${result.generatedCount} parcela(s) gerada(s)`)
			generationModal.onClose()
			await loadData()
		} else toast.error(result.error)
		setFormLoading(false)
	}

	const openPayment = (installment: DebtView["installments"][number]) => {
		setSelectedInstallment(installment)
		setPaymentForm((current) => ({
			...current,
			amount: (installment.plannedAmount / 100).toFixed(2),
		}))
		paymentModal.onOpen()
	}

	const handlePayment = async () => {
		if (!selectedInstallment || !paymentForm.accountId || !paymentForm.amount)
			return
		setFormLoading(true)
		const result = await registerDebtPayment({
			installmentId: selectedInstallment.id,
			accountId: paymentForm.accountId,
			amount: Number(paymentForm.amount.replace(",", ".")),
			date: dateFromInput(paymentForm.date),
		})
		if (result.success) {
			toast.success("Pagamento registrado")
			paymentModal.onClose()
			await loadData()
		} else toast.error(result.error)
		setFormLoading(false)
	}

	if (loading)
		return (
			<div className="flex min-h-[320px] items-center justify-center">
				<Spinner label="Carregando dívidas..." />
			</div>
		)
	const totalOutstanding = debts.reduce(
		(total, debt) => total + debt.outstandingAmount,
		0,
	)
	const nextInstallment = debts
		.flatMap((debt) => debt.installments)
		.filter((installment) => installment.plannedAmount > 0)
		.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())[0]

	return (
		<div className="space-y-6">
			{!debtId && (
				<div className="grid gap-4 md:grid-cols-2">
					<StatCard
						title="Total em aberto"
						value={formatCurrency(totalOutstanding)}
						subtitle={`${debts.filter((debt) => debt.status === "ACTIVE").length} dívida(s) ativa(s)`}
						icon={CreditCard}
						gradient="purple"
					/>
					<StatCard
						title="Próxima parcela"
						value={
							nextInstallment
								? formatCurrency(nextInstallment.plannedAmount)
								: "Sem pendências"
						}
						subtitle={
							nextInstallment
								? new Intl.DateTimeFormat("pt-BR").format(
										nextInstallment.dueDate,
									)
								: ""
						}
						icon={ReceiptText}
						gradient="blue"
					/>
				</div>
			)}
			{!debtId && (
				<div className="flex justify-end">
					<Button
						color="primary"
						startContent={<Plus className="h-4 w-4" />}
						onPress={createModal.onOpen}
					>
						Nova Dívida
					</Button>
				</div>
			)}
			{error && (
				<div className="modern-card border-l-4 border-l-red-500 p-5 text-red-600">
					{error}
				</div>
			)}
			{!error && debts.length === 0 && (
				<div className="modern-card p-12 text-center text-slate-500">
					<CreditCard className="mx-auto mb-3 h-12 w-12 text-slate-300" />
					<p>Nenhuma dívida cadastrada.</p>
					{!debtId && (
						<Button
							className="mt-4"
							color="primary"
							onPress={createModal.onOpen}
						>
							Cadastrar primeira dívida
						</Button>
					)}
				</div>
			)}
			{debts.map((debt) => (
				<DebtCard
					key={debt.id}
					debt={debt}
					showDetailLink={!debtId}
					onPay={openPayment}
					onGenerate={openGeneration}
				/>
			))}
			<DebtFormModal
				isOpen={createModal.isOpen}
				onClose={createModal.onClose}
				loading={formLoading}
				form={debtForm}
				categories={categories}
				onChange={setDebtForm}
				onSubmit={handleCreate}
			/>
			<GenerationModal
				isOpen={generationModal.isOpen}
				onClose={generationModal.onClose}
				loading={formLoading}
				form={generationForm}
				debt={selectedDebt}
				onChange={setGenerationForm}
				onSubmit={handleGeneration}
			/>
			<PaymentModal
				isOpen={paymentModal.isOpen}
				onClose={paymentModal.onClose}
				loading={formLoading}
				form={paymentForm}
				accounts={accounts}
				installment={selectedInstallment}
				onChange={setPaymentForm}
				onSubmit={handlePayment}
			/>
		</div>
	)
}

function DebtCard({
	debt,
	showDetailLink,
	onPay,
	onGenerate,
}: {
	debt: DebtView
	showDetailLink: boolean
	onPay: (installment: DebtView["installments"][number]) => void
	onGenerate: (debt: DebtView) => void
}) {
	const paid = debt.totalAmount - debt.outstandingAmount
	const progress = debt.totalAmount
		? Math.round((paid / debt.totalAmount) * 100)
		: 0
	return (
		<section className="modern-card p-5 space-y-4">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
				<div>
					<div className="flex items-center gap-2">
						<h2 className="text-lg font-semibold">{debt.creditor}</h2>
						<Chip
							size="sm"
							color={debt.status === "PAID" ? "success" : "warning"}
							variant="flat"
						>
							{debt.status === "PAID" ? "Quitada" : "Ativa"}
						</Chip>
					</div>
					<p className="text-sm text-slate-500">{debt.description}</p>
					<p className="mt-1 text-xs text-slate-400">
						{debt.category.name} · {debt.installmentCount} parcelas geradas
					</p>
				</div>
				<div className="text-left sm:text-right">
					<p className="text-xs text-slate-500">Em aberto</p>
					<p className="text-xl font-bold text-red-600">
						{formatCurrency(debt.outstandingAmount)}
					</p>
				</div>
			</div>
			<div>
				<div className="mb-1 flex justify-between text-xs text-slate-500">
					<span>Progresso de pagamento</span>
					<span>{progress}%</span>
				</div>
				<div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
					<div
						className="h-full bg-gradient-to-r from-amber-500 to-emerald-500"
						style={{ width: `${progress}%` }}
					/>
				</div>
			</div>
			{!showDetailLink && (
				<div className="space-y-2 border-t pt-4">
					{debt.installments.length === 0 && debt.status === "ACTIVE" ? (
						<div className="flex flex-col gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50 sm:flex-row sm:items-center sm:justify-between">
							<p className="text-sm text-slate-500">
								Nenhuma parcela futura foi gerada.
							</p>
							<Button
								size="sm"
								color="primary"
								onPress={() => onGenerate(debt)}
							>
								Gerar parcelas
							</Button>
						</div>
					) : (
						debt.installments.map((installment) => (
							<div
								key={installment.id}
								className="flex flex-col gap-2 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50 sm:flex-row sm:items-center sm:justify-between"
							>
								<div>
									<p className="font-medium">
										Parcela {installment.number}/{debt.installmentCount}
									</p>
									<p className="text-xs text-slate-500">
										{new Intl.DateTimeFormat("pt-BR").format(
											installment.dueDate,
										)}{" "}
										· previsto: {formatCurrency(installment.plannedAmount)}
									</p>
									{installment.payments.map((payment) => (
										<p key={payment.id} className="text-xs text-emerald-600">
											Pago {formatCurrency(payment.amount)} via{" "}
											{payment.event.account.name}
										</p>
									))}
								</div>
								{debt.status === "ACTIVE" && debt.outstandingAmount > 0 && (
									<Button
										size="sm"
										color="primary"
										variant="flat"
										onPress={() => onPay(installment)}
									>
										Registrar pagamento
									</Button>
								)}
							</div>
						))
					)}
				</div>
			)}
			{showDetailLink && (
				<Link
					className="inline-flex text-sm font-medium text-primary"
					href={`/debts/${debt.id}`}
				>
					Ver parcelas e pagamentos
				</Link>
			)}
		</section>
	)
}

function DebtFormModal({
	isOpen,
	onClose,
	loading,
	form,
	categories,
	onChange,
	onSubmit,
}: {
	isOpen: boolean
	onClose: () => void
	loading: boolean
	form: DebtFormState
	categories: CategoryWithGroup[]
	onChange: (form: DebtFormState) => void
	onSubmit: () => void
}) {
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

function GenerationModal({
	isOpen,
	onClose,
	loading,
	form,
	debt,
	onChange,
	onSubmit,
}: {
	isOpen: boolean
	onClose: () => void
	loading: boolean
	form: GenerationFormState
	debt: DebtView | null
	onChange: (form: GenerationFormState) => void
	onSubmit: () => void
}) {
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

function PaymentModal({
	isOpen,
	onClose,
	loading,
	form,
	accounts,
	installment,
	onChange,
	onSubmit,
}: {
	isOpen: boolean
	onClose: () => void
	loading: boolean
	form: PaymentFormState
	accounts: AccountWithBalance[]
	installment: DebtView["installments"][number] | null
	onChange: (form: PaymentFormState) => void
	onSubmit: () => void
}) {
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
