"use client"

import { useEffect, useState } from "react"
import { Button, Spinner, useDisclosure } from "@nextui-org/react"
import { PiggyBank, Plus, TrendingUp, Wallet } from "lucide-react"
import { toast } from "react-toastify"
import {
	createAccount,
	deleteAccount,
	getAccountBalances,
	updateAccount,
	type AccountWithBalance,
	type CreateAccountInput,
	type UpdateAccountInput,
} from "@/features/accounts"
import { createTransfer, type CreateTransferInput } from "@/features/events"
import {
	centsToDollars,
	dateFromInput,
	formatCurrency,
	formatDateInput,
} from "@/types/finance"
import { StatCard } from "@/components/ui/stat-card"
import { AccountCard } from "./account-card"
import { AccountFormModal, type AccountFormData } from "./account-form-modal"
import { TransferModal, type TransferFormData } from "./transfer-modal"

export function AccountsList() {
	const [accounts, setAccounts] = useState<AccountWithBalance[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const { isOpen, onOpen, onClose } = useDisclosure()
	const {
		isOpen: isEditOpen,
		onOpen: onEditOpen,
		onClose: onEditClose,
	} = useDisclosure()
	const {
		isOpen: isTransferOpen,
		onOpen: onTransferOpen,
		onClose: onTransferClose,
	} = useDisclosure()
	const [formLoading, setFormLoading] = useState(false)
	const [formData, setFormData] = useState<AccountFormData>({
		name: "",
		type: "BANK",
		initialBalance: "",
	})
	const [editData, setEditData] = useState<
		(AccountFormData & { id: string }) | null
	>(null)
	const [transferData, setTransferData] = useState<TransferFormData | null>(
		null,
	)

	useEffect(() => {
		loadAccounts()
	}, [])

	async function loadAccounts() {
		setLoading(true)
		setError(null)
		const result = await getAccountBalances()
		if (result.success) setAccounts(result.accounts)
		else setError(result.error)
		setLoading(false)
	}

	async function handleCreate() {
		if (!formData.name) return toast.error("Nome da conta é obrigatório")
		setFormLoading(true)
		const input: CreateAccountInput = {
			...formData,
			initialBalance: parseFloat(formData.initialBalance) || 0,
		}
		const result = await createAccount(input)
		if (result.success) {
			toast.success("Conta criada com sucesso")
			loadAccounts()
			onClose()
			setFormData({ name: "", type: "BANK", initialBalance: "" })
		} else toast.error(result.error)
		setFormLoading(false)
	}

	function handleEdit(account: AccountWithBalance) {
		setEditData({
			id: account.id,
			name: account.name,
			type: account.type,
			initialBalance: centsToDollars(account.initialBalance).toString(),
		})
		onEditOpen()
	}

	async function handleUpdate() {
		if (!editData) return
		if (!editData.name) return toast.error("Nome da conta é obrigatório")
		setFormLoading(true)
		const input: UpdateAccountInput = {
			...editData,
			initialBalance: parseFloat(editData.initialBalance) || 0,
		}
		const result = await updateAccount(input)
		if (result.success) {
			toast.success("Conta atualizada com sucesso")
			loadAccounts()
			onEditClose()
			setEditData(null)
		} else toast.error(result.error)
		setFormLoading(false)
	}

	async function handleDelete(accountId: string) {
		if (!confirm("Tem certeza que deseja excluir esta conta?")) return
		const result = await deleteAccount(accountId)
		if (result.success) {
			toast.success("Conta excluída")
			loadAccounts()
		} else toast.error(result.error)
	}

	function handleTransfer(account: AccountWithBalance) {
		const destination = accounts.find((item) => item.id !== account.id)
		setTransferData({
			fromAccountId: account.id,
			fromAccountName: account.name,
			toAccountId: destination?.id || "",
			amount: "",
			description: "",
			date: formatDateInput(new Date()),
		})
		onTransferOpen()
	}

	async function handleTransferSubmit() {
		if (!transferData) return
		if (!transferData.toAccountId)
			return toast.error("Selecione uma conta de destino")
		if (!transferData.amount || parseFloat(transferData.amount) <= 0)
			return toast.error("O valor deve ser maior que zero")
		if (!transferData.description.trim())
			return toast.error("A descrição é obrigatória")
		setFormLoading(true)
		const input: CreateTransferInput = {
			...transferData,
			amount: parseFloat(transferData.amount),
			date: dateFromInput(transferData.date),
		}
		const result = await createTransfer(input)
		if (result.success) {
			toast.success("Transferência realizada com sucesso")
			if (result.warning) toast.warning(result.warning)
			loadAccounts()
			onTransferClose()
			setTransferData(null)
		} else toast.error(result.error)
		setFormLoading(false)
	}

	const regularAccounts = accounts
		.filter((account) => account.type !== "INVESTMENT")
		.sort((a, b) => b.currentBalance - a.currentBalance)
	const investmentAccounts = accounts
		.filter((account) => account.type === "INVESTMENT")
		.sort((a, b) => b.currentBalance - a.currentBalance)
	const regularBalance = regularAccounts.reduce(
		(total, account) => total + account.currentBalance,
		0,
	)
	const investmentBalance = investmentAccounts.reduce(
		(total, account) => total + account.currentBalance,
		0,
	)

	if (loading)
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<Spinner size="lg" label="Carregando contas..." />
			</div>
		)

	return (
		<div className="space-y-6">
			<div className="grid gap-4 sm:grid-cols-2">
				<StatCard
					title="Saldo em Contas"
					value={formatCurrency(regularBalance)}
					subtitle={`${regularAccounts.length} conta(s) disponível(is)`}
					icon={Wallet}
					variant={regularBalance >= 0 ? "default" : "danger"}
				/>
				{investmentAccounts.length > 0 ? (
					<div className="modern-card flex items-center justify-between p-5 text-slate-600 dark:text-slate-300">
						<div>
							<p className="text-sm font-medium">Investimentos</p>
							<p className="text-2xl font-semibold">
								{formatCurrency(investmentBalance)}
							</p>
							<p className="text-xs text-slate-500">
								{investmentAccounts.length} conta(s) de investimento
							</p>
						</div>
						<TrendingUp className="h-6 w-6 text-slate-400" />
					</div>
				) : null}
			</div>
			<div className="flex justify-end">
				<Button
					color="primary"
					onPress={onOpen}
					startContent={<Plus className="w-4 h-4" />}
				>
					Nova Conta
				</Button>
			</div>
			{error ? (
				<div className="modern-card p-5 border-l-4 border-l-red-500">
					<p className="text-red-600">{error}</p>
					<Button
						color="primary"
						size="sm"
						className="mt-2"
						onPress={loadAccounts}
					>
						Tentar Novamente
					</Button>
				</div>
			) : null}
			{!error && accounts.length === 0 ? (
				<div className="modern-card p-12 text-center">
					<PiggyBank className="w-12 h-12 text-slate-300 mx-auto mb-3" />
					<p className="text-slate-500">Nenhuma conta cadastrada.</p>
					<Button color="primary" className="mt-4" onPress={onOpen}>
						Criar sua primeira conta
					</Button>
				</div>
			) : null}
			{!error && accounts.length > 0 ? (
				<div className="grid gap-4">
					<AccountGroup
						title="Contas disponíveis"
						subtitle="Banco e dinheiro"
						accounts={regularAccounts}
						canTransfer={accounts.length > 1}
						onEdit={handleEdit}
						onTransfer={handleTransfer}
						onDelete={handleDelete}
					/>
					<AccountGroup
						title="Contas de investimento"
						accounts={investmentAccounts}
						canTransfer={accounts.length > 1}
						onEdit={handleEdit}
						onTransfer={handleTransfer}
						onDelete={handleDelete}
						isSeparated
					/>
				</div>
			) : null}
			<AccountFormModal
				isOpen={isOpen}
				mode="create"
				data={formData}
				isLoading={formLoading}
				onClose={onClose}
				onChange={setFormData}
				onSubmit={handleCreate}
			/>
			<AccountFormModal
				isOpen={isEditOpen}
				mode="edit"
				data={editData}
				isLoading={formLoading}
				onClose={onEditClose}
				onChange={(data) =>
					setEditData((previous) =>
						previous ? { ...previous, ...data } : null,
					)
				}
				onSubmit={handleUpdate}
			/>
			<TransferModal
				isOpen={isTransferOpen}
				data={transferData}
				destinationAccounts={accounts.filter(
					(account) => account.id !== transferData?.fromAccountId,
				)}
				isLoading={formLoading}
				onClose={onTransferClose}
				onChange={setTransferData}
				onSubmit={handleTransferSubmit}
			/>
		</div>
	)
}

interface AccountGroupProps {
	title: string
	subtitle?: string
	accounts: AccountWithBalance[]
	canTransfer: boolean
	isSeparated?: boolean
	onEdit: (account: AccountWithBalance) => void
	onTransfer: (account: AccountWithBalance) => void
	onDelete: (accountId: string) => void
}

function AccountGroup({
	title,
	subtitle,
	accounts,
	canTransfer,
	isSeparated,
	onEdit,
	onTransfer,
	onDelete,
}: AccountGroupProps) {
	if (accounts.length === 0) return null
	return (
		<>
			<div
				className={`col-span-full ${isSeparated ? "mt-4 border-t border-slate-200 pt-5 dark:border-slate-800" : ""}`}
			>
				<p className="text-sm font-medium text-slate-500">{title}</p>
				{subtitle ? <p className="text-xs text-slate-400">{subtitle}</p> : null}
			</div>
			{accounts.map((account) => (
				<AccountCard
					key={account.id}
					account={account}
					canTransfer={canTransfer}
					onEdit={onEdit}
					onTransfer={onTransfer}
					onDelete={onDelete}
				/>
			))}
		</>
	)
}
