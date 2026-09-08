"use client"

import { Input } from "@nextui-org/react"
import type { CategoryWithGroup } from "@/features/categories"

interface BudgetCategoryRowProps {
	category: CategoryWithGroup
	value: string
	onValueChange: (value: string) => void
}

export function BudgetCategoryRow({
	category,
	value,
	onValueChange,
}: BudgetCategoryRowProps) {
	return (
		<div className="grid grid-cols-[1fr_140px] items-center gap-3 border-b p-4 last:border-0">
			<div>
				<p className="font-medium">{category.name}</p>
				<p className="text-sm text-slate-500">{category.categoryGroup.name}</p>
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
