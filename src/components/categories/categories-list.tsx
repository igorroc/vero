"use client"

import { useEffect, useRef, useState } from "react"
import {
	Button,
	Input,
	Modal,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalHeader,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Select,
	SelectItem,
	Spinner,
	useDisclosure,
} from "@nextui-org/react"
import { Plus, Tag, Trash2 } from "lucide-react"
import { toast } from "react-toastify"
import {
	categoryGroupTypeLabels,
	createCategory,
	deleteCategory,
	getCategoryGroups,
	updateCategory,
	type CategoryGroupWithCategories,
} from "@/features/categories"

interface CategoryFormData {
	id?: string
	name: string
	categoryGroupId: string
}

export function CategoriesList() {
	const [groups, setGroups] = useState<CategoryGroupWithCategories[]>([])
	const [loading, setLoading] = useState(true)
	const [saving, setSaving] = useState(false)
	const [quickGroupId, setQuickGroupId] = useState<string | null>(null)
	const [quickName, setQuickName] = useState("")
	const quickInputRef = useRef<HTMLInputElement>(null)
	const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
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
		if (result.success) requestAnimationFrame(() => quickInputRef.current?.focus())
	}

	const beginInlineEdit = (
		category: CategoryGroupWithCategories["categories"][number],
	) => {
		setEditingCategoryId(category.id)
		setEditingName(category.name)
		requestAnimationFrame(() => editInputRef.current?.focus())
	}

	const saveInlineEdit = async (categoryId: string, categoryGroupId: string) => {
		const name = editingName.trim()
		setEditingCategoryId(null)
		if (!name) return

		setSaving(true)
		const result = await updateCategory({ id: categoryId, name, categoryGroupId })
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

			{(["INCOME", "ESSENTIAL", "LIFESTYLE", "INVESTMENT"] as const).map((type) => {
				const groupsByType = groups.filter((group) => group.type === type)
				return (
					<section key={type} className="space-y-3">
						<h2 className="text-lg font-bold text-slate-900 dark:text-white">
							{categoryGroupTypeLabels[type]}
						</h2>
						<div className="grid gap-4 lg:grid-cols-2">
							{groupsByType.map((group) => (
								<div key={group.id} className="modern-card p-4">
									<div className="mb-3 flex items-center justify-between gap-3">
										<div className="flex items-center gap-2">
											<Tag className="h-4 w-4 text-blue-600" />
											<h3 className="font-semibold text-slate-900 dark:text-white">
												{group.name}
											</h3>
										</div>
										<Popover
											isOpen={quickGroupId === group.id}
											onOpenChange={(isOpen) => {
												setQuickGroupId(isOpen ? group.id : null)
												if (isOpen) setQuickName("")
											}}
											placement="bottom-end"
										>
											<PopoverTrigger>
												<Button isIconOnly size="sm" variant="light" aria-label={`Adicionar categoria em ${group.name}`}>
													<Plus className="h-4 w-4" />
												</Button>
											</PopoverTrigger>
											<PopoverContent className="w-64 p-3">
												<Input
													ref={quickInputRef}
													autoFocus
													size="sm"
													placeholder="Nome da categoria"
													aria-label={`Nova categoria em ${group.name}`}
													value={quickName}
													isDisabled={saving}
													onValueChange={setQuickName}
													onKeyDown={(event) => {
														if (event.key === "Enter") {
															event.preventDefault()
															handleQuickCreate()
														}
													}}
												/>
												<p className="mt-2 text-xs text-slate-500">Pressione Enter para adicionar.</p>
											</PopoverContent>
										</Popover>
									</div>

									{group.categories.length === 0 ? (
										<p className="text-sm text-slate-500">
											Nenhuma categoria cadastrada.
										</p>
									) : (
										<div className="space-y-1">
											{group.categories.map((category) => (
												<div
													key={category.id}
													className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800"
												>
													{editingCategoryId === category.id ? (
														<Input
															ref={editInputRef}
															autoFocus
															size="sm"
															value={editingName}
															isDisabled={saving}
															onValueChange={setEditingName}
															onBlur={() => saveInlineEdit(category.id, group.id)}
															onKeyDown={(event) => {
																if (event.key === "Enter") event.currentTarget.blur()
																if (event.key === "Escape") setEditingCategoryId(null)
															}}
														/>
													) : (
														<button type="button" className="rounded px-1 text-left text-sm text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-slate-300 dark:hover:bg-slate-800" onClick={() => beginInlineEdit(category)}>
															{category.name}
														</button>
													)}
													<div className="flex items-center">
														<Button
															isIconOnly
															size="sm"
															variant="light"
															color="danger"
															onPress={() => handleDelete(category.id)}
															aria-label={`Excluir ${category.name}`}
														>
															<Trash2 className="h-3.5 w-3.5" />
														</Button>
													</div>
												</div>
											))}
										</div>
									)}
								</div>
							))}
						</div>
					</section>
				)
			})}

			<Modal isOpen={isOpen} onClose={onClose}>
				<ModalContent>
					<ModalHeader>
						{formData.id ? "Editar categoria" : "Nova categoria"}
					</ModalHeader>
					<ModalBody>
						<Input
							label="Nome"
							value={formData.name}
							onValueChange={(name) => setFormData({ ...formData, name })}
							isRequired
						/>
						<Select
							label="Grupo"
							selectedKeys={
								formData.categoryGroupId ? [formData.categoryGroupId] : []
							}
							onSelectionChange={(keys) =>
								setFormData({
									...formData,
									categoryGroupId: String(Array.from(keys)[0] ?? ""),
								})
							}
							isRequired
						>
							{groups.map((group) => (
								<SelectItem key={group.id} textValue={group.name}>
									{categoryGroupTypeLabels[group.type]}: {group.name}
								</SelectItem>
							))}
						</Select>
					</ModalBody>
					<ModalFooter>
						<Button variant="flat" onPress={onClose}>
							Cancelar
						</Button>
						<Button color="primary" onPress={handleSave} isLoading={saving}>
							Salvar
						</Button>
					</ModalFooter>
				</ModalContent>
			</Modal>
		</div>
	)
}
