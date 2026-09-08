"use client"

import type { RefObject } from "react"
import {
	Button,
	Input,
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@nextui-org/react"
import { Plus, Tag } from "lucide-react"
import type { CategoryGroupWithCategories } from "@/features/categories"
import { CategoryListItem } from "./category-list-item"

interface CategoryGroupCardProps {
	group: CategoryGroupWithCategories
	quickGroupId: string | null
	quickName: string
	quickInputRef: RefObject<HTMLInputElement>
	editingCategoryId: string | null
	editingName: string
	editInputRef: RefObject<HTMLInputElement>
	isSaving: boolean
	onQuickGroupChange: (groupId: string | null) => void
	onQuickNameChange: (name: string) => void
	onQuickCreate: () => void
	onBeginEdit: (
		category: CategoryGroupWithCategories["categories"][number],
	) => void
	onDelete: (categoryId: string) => void
	onEditingNameChange: (name: string) => void
	onCancelEdit: () => void
	onSaveEdit: (categoryId: string, categoryGroupId: string) => void
}

export function CategoryGroupCard({ group, ...props }: CategoryGroupCardProps) {
	return (
		<div className="modern-card p-4">
			<div className="mb-3 flex items-center justify-between gap-3">
				<div className="flex items-center gap-2">
					<Tag className="h-4 w-4 text-blue-600" />
					<h3 className="font-semibold text-slate-900 dark:text-white">
						{group.name}
					</h3>
				</div>
				<Popover
					isOpen={props.quickGroupId === group.id}
					onOpenChange={(isOpen) => {
						props.onQuickGroupChange(isOpen ? group.id : null)
						if (isOpen) props.onQuickNameChange("")
					}}
					placement="bottom-end"
				>
					<PopoverTrigger>
						<Button
							isIconOnly
							size="sm"
							variant="light"
							aria-label={`Adicionar categoria em ${group.name}`}
						>
							<Plus className="h-4 w-4" />
						</Button>
					</PopoverTrigger>
					<PopoverContent className="w-64 p-3">
						<Input
							ref={props.quickInputRef}
							autoFocus
							size="sm"
							placeholder="Nome da categoria"
							aria-label={`Nova categoria em ${group.name}`}
							value={props.quickName}
							isDisabled={props.isSaving}
							onValueChange={props.onQuickNameChange}
							onKeyDown={(event) => {
								if (event.key === "Enter") {
									event.preventDefault()
									props.onQuickCreate()
								}
							}}
						/>
						<p className="mt-2 text-xs text-slate-500">
							Pressione Enter para adicionar.
						</p>
					</PopoverContent>
				</Popover>
			</div>
			{group.categories.length === 0 ? (
				<p className="text-sm text-slate-500">Nenhuma categoria cadastrada.</p>
			) : (
				<div className="space-y-1">
					{group.categories.map((category) => (
						<CategoryListItem
							key={category.id}
							category={category}
							categoryGroupId={group.id}
							editingCategoryId={props.editingCategoryId}
							editingName={props.editingName}
							editInputRef={props.editInputRef}
							isSaving={props.isSaving}
							onBeginEdit={props.onBeginEdit}
							onDelete={props.onDelete}
							onEditingNameChange={props.onEditingNameChange}
							onCancelEdit={props.onCancelEdit}
							onSaveEdit={props.onSaveEdit}
						/>
					))}
				</div>
			)}
		</div>
	)
}
