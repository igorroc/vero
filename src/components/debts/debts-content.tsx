"use client"

import { useEffect, useState } from "react"
import { Button, Spinner, useDisclosure } from "@nextui-org/react"
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
} from "@/features/debts"
import { dateFromInput, formatCurrency, formatDateInput } from "@/types/finance"
import { StatCard } from "@/components/ui/stat-card"
import { DebtCard } from "./debt-card"
import { DebtFormModal } from "./debt-form-modal"
import { GenerationModal } from "./generation-modal"
import { PaymentModal } from "./payment-modal"
import type {
	DebtFormState,
	DebtInstallment,
	DebtView,
	GenerationFormState,
	PaymentFormState,
} from "./debt-types"

export function DebtsContent({ debtId }: { debtId?: string }) {
	const [debts, setDebts] = useState<DebtView[]>([])
	const [accounts, setAccounts] = useState<AccountWithBalance[]>([])
	const [categories, setCategories] = useState<CategoryWithGroup[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const createModal = useDisclosure()
	const paymentModal = useDisclosure()
	const generationModal = useDisclosure()
	const [selectedInstallment, setSelectedInstallment] =
		useState<DebtInstallment | null>(null)
	const [selectedDebt, setSelectedDebt] = useState<DebtView | null>(null)
	const [formLoading, setFormLoading] = useState(false)
	const [debtForm, setDebtForm] = useState<DebtFormState>({
		creditor: "",
		description: "",
		categoryId: "",
		totalAmount: "",
	})
	const [generationForm, setGenerationForm] = useState<GenerationFormState>({
		installmentCount: "",
		firstDueDate: formatDateInput(new Date()),
	})
	const [paymentForm, setPaymentForm] = useState<PaymentFormState>({
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

	const openPayment = (installment: DebtInstallment) => {
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
				<>
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
					<div className="flex justify-end">
						<Button
							color="primary"
							startContent={<Plus className="h-4 w-4" />}
							onPress={createModal.onOpen}
						>
							Nova Dívida
						</Button>
					</div>
				</>
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
