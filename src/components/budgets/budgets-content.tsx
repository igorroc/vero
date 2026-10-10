"use client"

import { useEffect, useState } from "react"
import { Button, Input, Spinner, useDisclosure } from "@nextui-org/react"
import { Save } from "lucide-react"
import { toast } from "react-toastify"
import {
	createBudget,
	getBudget,
	getBudgetReport,
	saveBudgetItems,
	type BudgetWithItems,
} from "@/features/budgets"
import { getCategories, type CategoryWithGroup } from "@/features/categories"

import { calculateBudgetPlanAdjustment } from "@/lib/engines/budget-report"
import { centsToDollars } from "@/types/finance"
import { BudgetCreateModal } from "./budget-create-modal"
import { BudgetPlanWarning } from "./budget-plan-warning"
import {
	amountInputToCents,
	budgetTypes,
	BudgetTypeSection,
} from "./budget-type-section"

export function BudgetsContent() {
	const now = new Date()
	const [year, setYear] = useState(now.getFullYear())
	const [month, setMonth] = useState(now.getMonth() + 1)
	const [budget, setBudget] = useState<BudgetWithItems | null>(null)
	const [categories, setCategories] = useState<CategoryWithGroup[]>([])
	const [values, setValues] = useState<Record<string, string>>({})
	const [usage, setUsage] = useState<
		Map<string, { actual: number; committed: number }>
	>(new Map())
	const [loading, setLoading] = useState(true)
	const [saving, setSaving] = useState(false)
	const { isOpen, onOpen, onClose } = useDisclosure()

	const load = async () => {
		setLoading(true)
		const [budgetResult, categoriesResult, reportResult] = await Promise.all([
			getBudget(year, month),
			getCategories(),
			getBudgetReport(year, month),
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
		if (reportResult.success && reportResult.report) {
			const nextUsage = new Map<
				string,
				{ actual: number; committed: number }
			>()
			for (const group of reportResult.report.groups) {
				for (const item of group.items) {
					nextUsage.set(item.categoryId, {
						actual: item.actual,
						committed: item.committed,
					})
				}
			}
			setUsage(nextUsage)
		} else {
			setUsage(new Map())
		}
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
	const typeTotals = budgetTypes.reduce(
		(totals, type) => {
			totals[type] = categories
				.filter((category) => category.categoryGroup.type === type)
				.reduce(
					(total, category) =>
						total + amountInputToCents(values[category.id] ?? ""),
					0,
				)
			return totals
		},
		{} as Record<(typeof budgetTypes)[number], number>,
	)
	const planAdjustment = calculateBudgetPlanAdjustment(typeTotals.INCOME, {
		ESSENTIAL: typeTotals.ESSENTIAL,
		LIFESTYLE: typeTotals.LIFESTYLE,
		INVESTMENT: typeTotals.INVESTMENT,
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

					{budgetTypes.map((type) => {
						const categoriesByType = categories.filter(
							(category) => category.categoryGroup.type === type,
						)
						if (!categoriesByType.length) return null
						return (
							<BudgetTypeSection
								key={type}
								type={type}
								categories={categoriesByType}
								values={values}
								total={typeTotals[type]}
								incomeTotal={typeTotals.INCOME}
								usage={usage}
								onValueChange={(categoryId, value) =>
									setValues((current) => ({ ...current, [categoryId]: value }))
								}
							/>
						)
					})}

					{planAdjustment && <BudgetPlanWarning adjustment={planAdjustment} />}

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

			<BudgetCreateModal
				isOpen={isOpen}
				isSaving={saving}
				monthLabel={monthLabel}
				onClose={onClose}
				onCreate={create}
			/>
		</div>
	)
}
