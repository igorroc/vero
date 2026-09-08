"use client"

import { Select, SelectItem, SelectSection } from "@nextui-org/react"
import type { CategoryWithGroup } from "@/features/categories"

type EventCategoryType = "INCOME" | "EXPENSE" | "INVESTMENT"

interface EventCategorySelectProps {
	categories: CategoryWithGroup[]
	type: EventCategoryType
	categoryId: string
	onSelectionChange: (categoryId: string) => void
	description?: string
}

export function EventCategorySelect({
	categories,
	type,
	categoryId,
	onSelectionChange,
	description,
}: EventCategorySelectProps) {
	const groups = Array.from(
		new Map(
			categories
				.filter((category) =>
					type === "INCOME"
						? category.categoryGroup.type === "INCOME"
						: type === "INVESTMENT"
							? category.categoryGroup.type === "INVESTMENT"
							: ["ESSENTIAL", "LIFESTYLE"].includes(
									category.categoryGroup.type,
								),
				)
				.map((category) => [category.categoryGroup.id, category.categoryGroup]),
		).values(),
	)

	return (
		<Select
			label="Categoria"
			size="sm"
			selectedKeys={categoryId ? [categoryId] : []}
			onSelectionChange={(keys) =>
				onSelectionChange(String(Array.from(keys)[0] ?? ""))
			}
			isRequired
			isDisabled={categories.length === 0}
			description={description}
		>
			{groups.map((group) => (
				<SelectSection key={group.id} title={group.name}>
					{categories
						.filter((category) => category.categoryGroupId === group.id)
						.map((category) => (
							<SelectItem key={category.id}>{category.name}</SelectItem>
						))}
				</SelectSection>
			))}
		</Select>
	)
}
