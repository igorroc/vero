"use client"

import { Input } from "@nextui-org/react"
import type { CategoryWithGroup } from "@/features/categories"
import { formatCurrency } from "@/types/finance"

interface BudgetCategoryRowProps {
	category: CategoryWithGroup
	value: string
	actual: number
	committed: number
	available: number
	onValueChange: (value: string) => void
}

export function BudgetCategoryRow({
	category,
	value,
	actual,
	committed,
	available,
	onValueChange,
}: BudgetCategoryRowProps) {
	const hasActivity = actual > 0 || committed > 0 || value.trim().length > 0

	return (
		<div className="grid grid-cols-[1fr_140px] items-center gap-3 border-b p-4 last:border-0">
			<div>
				<p className="font-medium">{category.name}</p>
				<p className="text-sm text-slate-500">{category.categoryGroup.name}</p>
				{hasActivity && (
					<p className="mt-1 text-xs text-slate-500">
						Realizado {formatCurrency(actual)} · Comprometido{" "}
						{formatCurrency(committed)} ·{" "}
						<span
							className={
								available < 0
									? "font-medium text-red-600 dark:text-red-400"
									: "font-medium text-emerald-600 dark:text-emerald-400"
							}
						>
							Disponível {formatCurrency(available)}
						</span>
					</p>
				)}
			</div>
			<Input
				aria-label={`Valor de ${category.name}`}
				type="number"
				min="0"
				step="0.01"
				placeholder="0,00"
				startContent="R$"
				value={value}
				onValueChange={onValueChange}
			/>
		</div>
	)
}
