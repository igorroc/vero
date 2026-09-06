"use client"

import { useEffect, useState } from "react"
import {
	Button,
	Input,
	Modal,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalHeader,
	Spinner,
	useDisclosure,
} from "@nextui-org/react"
import { Save } from "lucide-react"
import { toast } from "react-toastify"
import {
	createBudget,
	getBudget,
	saveBudgetItems,
	type BudgetWithItems,
} from "@/features/budgets"
import { getCategories, type CategoryWithGroup } from "@/features/categories"
import { centsToDollars } from "@/types/finance"

const types = ["INCOME", "ESSENTIAL", "LIFESTYLE", "INVESTMENT"] as const

const typeLabels = {
	INCOME: "Receitas",
	ESSENTIAL: "Essencial",
	LIFESTYLE: "Estilo de vida",
	INVESTMENT: "Investimentos",
}

export function BudgetsContent() {
	const now = new Date()
	const [year, setYear] = useState(now.getFullYear())
	const [month, setMonth] = useState(now.getMonth() + 1)
	const [budget, setBudget] = useState<BudgetWithItems | null>(null)
	const [categories, setCategories] = useState<CategoryWithGroup[]>([])
	const [values, setValues] = useState<Record<string, string>>({})
	const [loading, setLoading] = useState(true)
	const [saving, setSaving] = useState(false)
	const { isOpen, onOpen, onClose } = useDisclosure()

	const load = async () => {
		setLoading(true)
		const [budgetResult, categoriesResult] = await Promise.all([
			getBudget(year, month),
			getCategories(),
		])
		if (budgetResult.success) {
			setBudget(budgetResult.budget)
			setValues(
				Object.fromEntries(
					budgetResult.budget?.items.map((item) => [
						item.categoryId,
						centsToDollars(item.amount).toFixed(2),
					]) ?? [],
				),
			)
		} else {
			toast.error(budgetResult.error)
		}
		if (categoriesResult.success) setCategories(categoriesResult.categories)
		else toast.error(categoriesResult.error)
		setLoading(false)
	}

	useEffect(() => {
		load()
	}, [year, month])

	const create = async (copyPrevious: boolean) => {
		setSaving(true)
		const result = await createBudget(year, month, copyPrevious)
		if (result.success) {
			onClose()
			toast.success("Orçamento criado")
			await load()
		} else {
			toast.error(result.error)
		}
		setSaving(false)
	}

	const save = async () => {
		if (!budget) return
		setSaving(true)
		const result = await saveBudgetItems(
			budget.id,
			categories.map((category) => ({
				categoryId: category.id,
				amount: Number((values[category.id] ?? "").replace(",", ".")),
			})),
		)
		if (result.success) {
			toast.success("Orçamento atualizado")
			await load()
		} else {
			toast.error(result.error)
		}
		setSaving(false)
	}

	const monthLabel = new Date(year, month - 1).toLocaleDateString("pt-BR", {
		month: "long",
		year: "numeric",
	})

	if (loading) {
		return (
			<div className="flex min-h-64 items-center justify-center">
				<Spinner label="Carregando orçamento..." />
			</div>
		)
	}

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
				<Input
					type="month"
					label="Mês do orçamento"
					value={`${year}-${String(month).padStart(2, "0")}`}
					onValueChange={(value) => {
						const [nextYear, nextMonth] = value.split("-").map(Number)
						setYear(nextYear)
						setMonth(nextMonth)
					}}
					className="max-w-xs"
				/>
				{!budget && (
					<Button color="primary" onPress={onOpen}>
						Criar orçamento
					</Button>
				)}
			</div>

			{!budget ? (
				<div className="modern-card p-8 text-center">
					<p className="text-slate-500">
						Nenhum orçamento criado para {monthLabel}.
					</p>
					<Button className="mt-4" color="primary" onPress={onOpen}>
						Criar orçamento
					</Button>
				</div>
			) : (
				<>
					<div className="modern-card p-4">
						<h2 className="font-semibold capitalize">
							Orçamento de {monthLabel}
						</h2>
						<p className="text-sm text-slate-500">
							Preencha os valores planejados. Categorias vazias ou com zero não
							entram no orçamento.
						</p>
					</div>

					{types.map((type) => {
						const categoriesByType = categories.filter(
							(category) => category.categoryGroup.type === type,
						)
						if (!categoriesByType.length) return null
						return (
							<section key={type} className="modern-card overflow-hidden">
								<h2 className="border-b p-4 font-semibold">
									{typeLabels[type]}
								</h2>
								{categoriesByType.map((category) => (
									<div
										key={category.id}
										className="grid grid-cols-[1fr_140px] items-center gap-3 border-b p-4 last:border-0"
									>
										<div>
											<p className="font-medium">{category.name}</p>
											<p className="text-sm text-slate-500">
												{category.categoryGroup.name}
											</p>
										</div>
										<Input
											aria-label={`Valor de ${category.name}`}
											type="number"
											min="0"
											step="0.01"
											placeholder="0,00"
											startContent="R$"
											value={values[category.id] ?? ""}
											onValueChange={(value) =>
												setValues((current) => ({
													...current,
													[category.id]: value,
												}))
											}
										/>
									</div>
								))}
							</section>
						)
					})}

					<div className="flex justify-end">
						<Button
							color="primary"
							startContent={<Save className="h-4 w-4" />}
							isLoading={saving}
							onPress={save}
						>
							Salvar orçamento
						</Button>
					</div>
				</>
			)}

			<Modal isOpen={isOpen} onClose={onClose}>
				<ModalContent>
					<ModalHeader>Criar orçamento</ModalHeader>
					<ModalBody>
						<p>Escolha como iniciar o orçamento de {monthLabel}.</p>
					</ModalBody>
					<ModalFooter>
						<Button
							variant="flat"
							onPress={() => create(false)}
							isLoading={saving}
						>
							Em branco
						</Button>
						<Button
							color="primary"
							onPress={() => create(true)}
							isLoading={saving}
						>
							Copiar mês anterior
						</Button>
					</ModalFooter>
				</ModalContent>
			</Modal>
		</div>
	)
}
