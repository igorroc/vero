"use client"

import type { RefObject } from "react"
import { Button, Input } from "@nextui-org/react"
import { Trash2 } from "lucide-react"
import type { CategoryGroupWithCategories } from "@/features/categories"

interface CategoryListItemProps {
	category: CategoryGroupWithCategories["categories"][number]
	categoryGroupId: string
	editingCategoryId: string | null
	editingName: string
	editInputRef: RefObject<HTMLInputElement>
	isSaving: boolean
	onBeginEdit: (
		category: CategoryGroupWithCategories["categories"][number],
	) => void
	onDelete: (categoryId: string) => void
	onEditingNameChange: (name: string) => void
	onCancelEdit: () => void
	onSaveEdit: (categoryId: string, categoryGroupId: string) => void
}

export function CategoryListItem({
	category,
	categoryGroupId,
	editingCategoryId,
	editingName,
	editInputRef,
	isSaving,
	onBeginEdit,
	onDelete,
	onEditingNameChange,
	onCancelEdit,
	onSaveEdit,
}: CategoryListItemProps) {
	const isEditing = editingCategoryId === category.id

	return (
		<div className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800">
			{isEditing ? (
				<Input
					ref={editInputRef}
					autoFocus
					size="sm"
					value={editingName}
					isDisabled={isSaving}
					onValueChange={onEditingNameChange}
					onBlur={() => onSaveEdit(category.id, categoryGroupId)}
					onKeyDown={(event) => {
						if (event.key === "Enter") event.currentTarget.blur()
						if (event.key === "Escape") onCancelEdit()
					}}
				/>
			) : (
				<button
					type="button"
					className="rounded px-1 text-left text-sm text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-slate-300 dark:hover:bg-slate-800"
					onClick={() => onBeginEdit(category)}
				>
					{category.name}
				</button>
			)}
			<Button
				isIconOnly
				size="sm"
				variant="light"
				color="danger"
				onPress={() => onDelete(category.id)}
				aria-label={`Excluir ${category.name}`}
			>
				<Trash2 className="h-3.5 w-3.5" />
			</Button>
		</div>
	)
}
