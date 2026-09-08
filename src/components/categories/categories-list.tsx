"use client"

import { useEffect, useRef, useState } from "react"
import { Button, Spinner, useDisclosure } from "@nextui-org/react"
import { Plus } from "lucide-react"
import { toast } from "react-toastify"
import {
	categoryGroupTypeLabels,
	createCategory,
	deleteCategory,
	getCategoryGroups,
	updateCategory,
	type CategoryGroupWithCategories,
} from "@/features/categories"
import { CategoryFormModal, type CategoryFormData } from "./category-form-modal"
import { CategoryGroupCard } from "./category-group-card"

export function CategoriesList() {
	const [groups, setGroups] = useState<CategoryGroupWithCategories[]>([])
	const [loading, setLoading] = useState(true)
	const [saving, setSaving] = useState(false)
	const [quickGroupId, setQuickGroupId] = useState<string | null>(null)
	const [quickName, setQuickName] = useState("")
	const quickInputRef = useRef<HTMLInputElement>(null)
	const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
		null,
	)
	const [editingName, setEditingName] = useState("")
	const editInputRef = useRef<HTMLInputElement>(null)
	const [formData, setFormData] = useState<CategoryFormData>({
		name: "",
		categoryGroupId: "",
	})
	const { isOpen, onOpen, onClose } = useDisclosure()

	const loadGroups = async () => {
		setLoading(true)
		const result = await getCategoryGroups()
		if (result.success) {
			setGroups(result.groups)
		} else {
			toast.error(result.error)
		}
		setLoading(false)
	}

	useEffect(() => {
		loadGroups()
	}, [])

	const openCreate = (categoryGroupId = groups[0]?.id ?? "") => {
		setFormData({ name: "", categoryGroupId })
		onOpen()
	}

	const handleSave = async () => {
		if (!formData.name.trim() || !formData.categoryGroupId) {
			toast.error("Informe o nome e o grupo da categoria")
			return
		}

		setSaving(true)
		const result = formData.id
			? await updateCategory({ ...formData, id: formData.id })
			: await createCategory(formData)

		if (result.success) {
			toast.success(formData.id ? "Categoria atualizada" : "Categoria criada")
			onClose()
			await loadGroups()
		} else {
			toast.error(result.error)
		}
		setSaving(false)
	}

	const handleDelete = async (categoryId: string) => {
		if (!confirm("Deseja excluir esta categoria?")) return

		const result = await deleteCategory(categoryId)
		if (result.success) {
			toast.success("Categoria excluída")
			await loadGroups()
		} else {
			toast.error(result.error)
		}
	}

	const handleQuickCreate = async () => {
		if (!quickGroupId || !quickName.trim()) return

		setSaving(true)
		const result = await createCategory({
			name: quickName,
			categoryGroupId: quickGroupId,
		})
		if (result.success) {
			setQuickName("")
			await loadGroups()
		} else {
			toast.error(result.error)
		}
		setSaving(false)
		if (result.success)
			requestAnimationFrame(() => quickInputRef.current?.focus())
	}

	const beginInlineEdit = (
		category: CategoryGroupWithCategories["categories"][number],
	) => {
		setEditingCategoryId(category.id)
		setEditingName(category.name)
		requestAnimationFrame(() => editInputRef.current?.focus())
	}

	const saveInlineEdit = async (
		categoryId: string,
		categoryGroupId: string,
	) => {
		const name = editingName.trim()
		setEditingCategoryId(null)
		if (!name) return

		setSaving(true)
		const result = await updateCategory({
			id: categoryId,
			name,
			categoryGroupId,
		})
		if (result.success) {
			await loadGroups()
		} else {
			toast.error(result.error)
		}
		setSaving(false)
	}

	if (loading) {
		return (
			<div className="flex min-h-64 items-center justify-center">
				<Spinner label="Carregando categorias..." />
			</div>
		)
	}

	return (
		<div className="space-y-6">
			<div className="flex justify-end">
				<Button
					color="primary"
					startContent={<Plus className="w-4 h-4" />}
					onPress={() => openCreate()}
				>
					Nova categoria
				</Button>
			</div>

			{(["INCOME", "ESSENTIAL", "LIFESTYLE", "INVESTMENT"] as const).map(
				(type) => {
					const groupsByType = groups.filter((group) => group.type === type)
					return (
						<section key={type} className="space-y-3">
							<h2 className="text-lg font-bold text-slate-900 dark:text-white">
								{categoryGroupTypeLabels[type]}
							</h2>
							<div className="grid gap-4 lg:grid-cols-2">
								{groupsByType.map((group) => (
									<CategoryGroupCard
										key={group.id}
										group={group}
										quickGroupId={quickGroupId}
										quickName={quickName}
										quickInputRef={quickInputRef}
										editingCategoryId={editingCategoryId}
										editingName={editingName}
										editInputRef={editInputRef}
										isSaving={saving}
										onQuickGroupChange={setQuickGroupId}
										onQuickNameChange={setQuickName}
										onQuickCreate={handleQuickCreate}
										onBeginEdit={beginInlineEdit}
										onDelete={handleDelete}
										onEditingNameChange={setEditingName}
										onCancelEdit={() => setEditingCategoryId(null)}
										onSaveEdit={saveInlineEdit}
									/>
								))}
							</div>
						</section>
					)
				},
			)}

			<CategoryFormModal
				formData={formData}
				groups={groups}
				isOpen={isOpen}
				isSaving={saving}
				onClose={onClose}
				onSave={handleSave}
				onFormDataChange={setFormData}
			/>
		</div>
	)
}
