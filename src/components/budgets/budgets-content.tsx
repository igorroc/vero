"use client"

import { useEffect, useState } from "react"
import { Button, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Select, SelectItem, Spinner, useDisclosure } from "@nextui-org/react"
import { Plus, Trash2 } from "lucide-react"
import { toast } from "react-toastify"
import { createBudget, deleteBudgetItem, getBudget, saveBudgetItem, type BudgetWithItems } from "@/features/budgets"
import { getCategories, type CategoryWithGroup } from "@/features/categories"
import { centsToDollars } from "@/types/finance"

const types = ["INCOME", "ESSENTIAL", "LIFESTYLE", "INVESTMENT"] as const

export function BudgetsContent() {
	const now = new Date()
	const [year, setYear] = useState(now.getFullYear())
	const [month, setMonth] = useState(now.getMonth() + 1)
	const [budget, setBudget] = useState<BudgetWithItems | null>(null)
	const [categories, setCategories] = useState<CategoryWithGroup[]>([])
	const [loading, setLoading] = useState(true)
	const [saving, setSaving] = useState(false)
	const [categoryId, setCategoryId] = useState("")
	const [amount, setAmount] = useState("")
	const { isOpen, onOpen, onClose } = useDisclosure()

	const load = async () => {
		setLoading(true)
		const [budgetResult, categoriesResult] = await Promise.all([getBudget(year, month), getCategories()])
		if (budgetResult.success) setBudget(budgetResult.budget)
		else toast.error(budgetResult.error)
		if (categoriesResult.success) setCategories(categoriesResult.categories)
		else toast.error(categoriesResult.error)
		setLoading(false)
	}
	useEffect(() => { load() }, [year, month])

	const create = async (copyPrevious: boolean) => {
		setSaving(true)
		const result = await createBudget(year, month, copyPrevious)
		if (result.success) { setBudget(result.budget); onClose(); toast.success("Orçamento criado") }
		else toast.error(result.error)
		setSaving(false)
	}
	const saveItem = async () => {
		if (!budget || !categoryId || !amount) return toast.error("Selecione uma categoria e informe o valor")
		setSaving(true)
		const result = await saveBudgetItem(budget.id, categoryId, Number(amount.replace(",", ".")))
		if (result.success) { setCategoryId(""); setAmount(""); await load(); toast.success("Valor salvo") }
		else toast.error(result.error)
		setSaving(false)
	}
	const removeItem = async (id: string) => {
		const result = await deleteBudgetItem(id)
		if (result.success) { await load(); toast.success("Item removido") } else toast.error(result.error)
	}
	const availableCategories = categories.filter((category) => !budget?.items.some((item) => item.categoryId === category.id))
	const monthLabel = new Date(year, month - 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })

	if (loading) return <div className="flex min-h-64 items-center justify-center"><Spinner label="Carregando orçamento..." /></div>
	return <div className="space-y-6">
		<div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
			<Input type="month" label="Mês do orçamento" value={`${year}-${String(month).padStart(2, "0")}`} onValueChange={(value) => { const [nextYear, nextMonth] = value.split("-").map(Number); setYear(nextYear); setMonth(nextMonth) }} className="max-w-xs" />
			{!budget && <Button color="primary" onPress={onOpen}>Criar orçamento</Button>}
		</div>
		{!budget ? <div className="modern-card p-8 text-center"><p className="text-slate-500">Nenhum orçamento criado para {monthLabel}.</p><Button className="mt-4" color="primary" onPress={onOpen}>Criar orçamento</Button></div> : <>
			<div className="modern-card p-4"><h2 className="font-semibold capitalize">Orçamento de {monthLabel}</h2><p className="text-sm text-slate-500">Adicione somente as categorias que terão um valor neste mês.</p></div>
			<div className="modern-card grid gap-3 p-4 sm:grid-cols-[1fr_180px_auto]">
				<Select label="Categoria" selectedKeys={categoryId ? [categoryId] : []} onSelectionChange={(keys) => setCategoryId(String(Array.from(keys)[0] ?? ""))}>{availableCategories.map((category) => <SelectItem key={category.id}>{category.categoryGroup.name}: {category.name}</SelectItem>)}</Select>
				<Input label="Valor" type="number" min="0.01" step="0.01" startContent="R$" value={amount} onValueChange={setAmount} />
				<Button color="primary" className="self-end" startContent={<Plus className="h-4 w-4" />} isLoading={saving} onPress={saveItem}>Adicionar</Button>
			</div>
			{types.map((type) => { const items = budget.items.filter((item) => item.category.categoryGroup.type === type); if (!items.length) return null; return <section key={type} className="modern-card overflow-hidden"><h2 className="border-b p-4 font-semibold">{type === "INCOME" ? "Receitas" : type === "ESSENTIAL" ? "Essencial" : type === "LIFESTYLE" ? "Estilo de vida" : "Investimentos"}</h2>{items.map((item) => <div key={item.id} className="flex items-center justify-between gap-3 border-b p-4 last:border-0"><span>{item.category.categoryGroup.name}: {item.category.name}</span><div className="flex items-center gap-2"><Input aria-label={`Valor de ${item.category.name}`} type="number" min="0.01" step="0.01" defaultValue={centsToDollars(item.amount).toFixed(2)} className="w-32" onBlur={(event) => saveBudgetItem(budget.id, item.categoryId, Number(event.target.value)).then((result) => { if (result.success) load(); else toast.error(result.error) })} /><Button isIconOnly size="sm" variant="light" color="danger" aria-label="Remover item" onPress={() => removeItem(item.id)}><Trash2 className="h-4 w-4" /></Button></div></div>)}</section> })}
		</>}
		<Modal isOpen={isOpen} onClose={onClose}><ModalContent><ModalHeader>Criar orçamento</ModalHeader><ModalBody><p>Escolha como iniciar o orçamento de {monthLabel}.</p></ModalBody><ModalFooter><Button variant="flat" onPress={() => create(false)} isLoading={saving}>Em branco</Button><Button color="primary" onPress={() => create(true)} isLoading={saving}>Copiar mês anterior</Button></ModalFooter></ModalContent></Modal>
	</div>
}
