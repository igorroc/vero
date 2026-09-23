"use client"

import { useMemo, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import {
	Button,
	Checkbox,
	Chip,
	Dropdown,
	DropdownItem,
	DropdownMenu,
	DropdownTrigger,
	Input,
} from "@nextui-org/react"
import {
	CheckCircle2,
	ChevronLeft,
	ChevronRight,
	CircleHelp,
	Clock,
	Search,
	SlidersHorizontal,
} from "lucide-react"
import type { Divergence } from "@/lib/engines/reconciliation"
import { formatCurrency } from "@/types/finance"

export type ReviewStatus = "matched" | "pending" | "unidentified" | "only-vero"

export type ReviewRow = {
	key: string
	date: string // DD/MM
	dateIso: string
	description: string
	amountCents: number
	status: ReviewStatus
	divergence: Divergence
}

type Tab = "all" | "matched" | "pending"
type SortKey = "date" | "value" | null

const PAGE_SIZE = 10

function formatDayMonth(iso: string): string {
	const [, month, day] = iso.split("-")
	return `${day}/${month}`
}

const KIND_LABELS: Record<Divergence["kind"], string> = {
	matched: "Conciliado",
	missing_in_vero: "Só no extrato",
	missing_in_statement: "Só no Vero",
	value_mismatch: "Valor difere",
	transfer_candidate: "Transferência?",
}

const KIND_COLORS: Record<
	Divergence["kind"],
	"success" | "warning" | "danger" | "primary" | "default"
> = {
	matched: "success",
	missing_in_vero: "warning",
	missing_in_statement: "primary",
	value_mismatch: "danger",
	transfer_candidate: "default",
}

function StatusPill({ kind }: { kind: Divergence["kind"] }) {
	return (
		<Chip
			size="sm"
			variant="flat"
			color={KIND_COLORS[kind]}
			startContent={
				kind === "matched" ? (
					<CheckCircle2 size={14} />
				) : kind === "missing_in_vero" ? (
					<Clock size={14} />
				) : kind === "transfer_candidate" ? (
					<CircleHelp size={14} />
				) : undefined
			}
		>
			{KIND_LABELS[kind]}
		</Chip>
	)
}

export function ReviewTable({
	rows,
	selectedKey,
	onSelect,
}: {
	rows: ReviewRow[]
	selectedKey: string | null
	onSelect: (row: ReviewRow | null) => void
}) {
	const [tab, setTab] = useState<Tab>("all")
	const [query, setQuery] = useState("")
	const [kindFilter, setKindFilter] = useState<Set<string>>(new Set())
	const [sortKey, setSortKey] = useState<SortKey>("date")
	const [sortAsc, setSortAsc] = useState(false)
	const [page, setPage] = useState(1)

	const matchedCount = useMemo(
		() => rows.filter((row) => row.status === "matched").length,
		[rows],
	)
	const pendingCount = useMemo(
		() => rows.filter((row) => row.status !== "matched").length,
		[rows],
	)

	const filtered = useMemo(() => {
		const q = query.trim().toLowerCase()
		let list = rows.filter((row) => {
			if (tab === "matched" && row.status !== "matched") return false
			if (tab === "pending" && row.status === "matched") return false
			if (kindFilter.size > 0 && !kindFilter.has(row.divergence.kind))
				return false
			if (!q) return true
			return (
				row.description.toLowerCase().includes(q) ||
				row.date.includes(q) ||
				row.dateIso.includes(q) ||
				String(Math.abs(row.amountCents)).includes(q.replace(/\D/g, ""))
			)
		})
		if (sortKey === "date") {
			list = [...list].sort((a, b) =>
				sortAsc
					? a.dateIso.localeCompare(b.dateIso)
					: b.dateIso.localeCompare(a.dateIso),
			)
		} else if (sortKey === "value") {
			list = [...list].sort((a, b) =>
				sortAsc ? a.amountCents - b.amountCents : b.amountCents - a.amountCents,
			)
		}
		return list
	}, [rows, tab, query, kindFilter, sortKey, sortAsc])

	const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
	const currentPage = Math.min(page, totalPages)
	const pageRows = filtered.slice(
		(currentPage - 1) * PAGE_SIZE,
		currentPage * PAGE_SIZE,
	)

	function toggleSort(key: Exclude<SortKey, null>) {
		if (sortKey !== key) {
			setSortKey(key)
			setSortAsc(true)
		} else {
			setSortAsc(!sortAsc)
		}
		setPage(1)
	}

	const pageNumbers = useMemo(() => {
		const nums: Array<number | "…"> = []
		for (let i = 1; i <= totalPages; i += 1) {
			if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= 2) {
				nums.push(i)
			} else if (nums[nums.length - 1] !== "…") {
				nums.push("…")
			}
		}
		return nums
	}, [totalPages, currentPage])

	return (
		<div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
			<div className="flex flex-col gap-2 border-b border-slate-200 p-3 sm:flex-row sm:items-center dark:border-slate-800">
				<div className="flex gap-1 rounded-xl bg-slate-100 p-1 text-sm dark:bg-slate-800">
					{(
						[
							{ key: "all", label: `Todos (${rows.length})` },
							{ key: "matched", label: `Conciliados (${matchedCount})` },
							{ key: "pending", label: `Pendentes (${pendingCount})` },
						] as Array<{ key: Tab; label: string }>
					).map(({ key, label }) => (
						<button
							key={key}
							type="button"
							onClick={() => {
								setTab(key)
								setPage(1)
							}}
							className={`rounded-lg px-3 py-1.5 font-semibold transition-colors ${
								tab === key
									? "bg-white text-teal-700 shadow-sm dark:bg-slate-900 dark:text-teal-300"
									: "text-slate-500"
							}`}
						>
							{label}
						</button>
					))}
				</div>
				<div className="flex flex-1 gap-2">
					<Input
						size="sm"
						placeholder="Buscar por descrição, valor ou data…"
						startContent={<Search size={15} className="shrink-0" />}
						value={query}
						onValueChange={(value) => {
							setQuery(value)
							setPage(1)
						}}
						className="flex-1"
					/>
					<Dropdown>
						<DropdownTrigger>
							<Button
								size="sm"
								variant="flat"
								startContent={<SlidersHorizontal size={14} />}
							>
								Filtros{kindFilter.size > 0 ? ` (${kindFilter.size})` : ""}
							</Button>
						</DropdownTrigger>
						<DropdownMenu
							aria-label="Filtrar por tipo"
							selectionMode="multiple"
							selectedKeys={kindFilter}
							onSelectionChange={(keys) => {
								setKindFilter(new Set(keys as Set<string>))
								setPage(1)
							}}
						>
							<DropdownItem key="missing_in_vero">Só no extrato</DropdownItem>
							<DropdownItem key="transfer_candidate">
								Transferência?
							</DropdownItem>
							<DropdownItem key="missing_in_statement">Só no Vero</DropdownItem>
							<DropdownItem key="value_mismatch">Valor difere</DropdownItem>
							<DropdownItem key="matched">Conciliado</DropdownItem>
						</DropdownMenu>
					</Dropdown>
				</div>
			</div>

			<div className="overflow-x-auto">
				<table className="w-full min-w-[720px] text-left text-sm">
					<thead>
						<tr className="border-b border-slate-200 text-xs text-slate-500 dark:border-slate-800">
							<th className="w-10 px-3 py-2" />
							<th className="px-2 py-2">
								<button
									type="button"
									onClick={() => toggleSort("date")}
									className="font-semibold hover:text-slate-800 dark:hover:text-slate-200"
								>
									Data {sortKey === "date" ? (sortAsc ? "↑" : "↓") : ""}
								</button>
							</th>
							<th className="px-2 py-2 font-semibold">Descrição</th>
							<th className="px-2 py-2 text-right">
								<button
									type="button"
									onClick={() => toggleSort("value")}
									className="font-semibold hover:text-slate-800 dark:hover:text-slate-200"
								>
									Valor {sortKey === "value" ? (sortAsc ? "↑" : "↓") : ""}
								</button>
							</th>
							<th className="px-2 py-2 font-semibold">Status</th>
							<th className="px-3 py-2 text-right font-semibold">Ação</th>
						</tr>
					</thead>
					<tbody>
						<AnimatePresence initial={false}>
							{pageRows.map((row) => (
								<motion.tr
									key={row.key}
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									exit={{ opacity: 0, x: 24 }}
									className={`border-b border-slate-100 last:border-0 dark:border-slate-800 ${
										selectedKey === row.key
											? "bg-teal-50 dark:bg-teal-950/40"
											: ""
									}`}
								>
									<td className="px-3 py-2.5">
										<Checkbox
											aria-label={`Selecionar ${row.description}`}
											isSelected={selectedKey === row.key}
											onValueChange={(selected) =>
												onSelect(selected ? row : null)
											}
										/>
									</td>
									<td className="whitespace-nowrap px-2 py-2.5 text-slate-500">
										{formatDayMonth(row.dateIso)}
									</td>
									<td className="max-w-[280px] truncate px-2 py-2.5 font-medium text-slate-800 dark:text-slate-100">
										{row.description}
									</td>
									<td
										className={`whitespace-nowrap px-2 py-2.5 text-right font-bold ${
											row.amountCents >= 0
												? "text-teal-600 dark:text-teal-400"
												: "text-rose-500"
										}`}
									>
										{formatCurrency(row.amountCents)}
									</td>
									<td className="whitespace-nowrap px-2 py-2.5">
										<StatusPill kind={row.divergence.kind} />
									</td>
									<td className="whitespace-nowrap px-3 py-2.5 text-right">
										{row.status === "matched" ? (
											<span className="text-slate-300 dark:text-slate-600">
												—
											</span>
										) : (
											<Button
												size="sm"
												variant="bordered"
												className="border-teal-600 font-semibold text-teal-700 dark:text-teal-300"
												onPress={() => onSelect(row)}
											>
												Conciliar
											</Button>
										)}
									</td>
								</motion.tr>
							))}
						</AnimatePresence>
					</tbody>
				</table>
				{pageRows.length === 0 && (
					<p className="px-4 py-10 text-center text-sm text-slate-500">
						Nenhum lançamento neste filtro. Tudo conciliado.
					</p>
				)}
			</div>

			<div className="flex items-center justify-between gap-2 border-t border-slate-200 px-3 py-2.5 text-xs text-slate-500 sm:text-sm dark:border-slate-800">
				<span>
					Mostrando {pageRows.length} de {filtered.length} lançamentos
				</span>
				<div className="flex items-center gap-1">
					<Button
						size="sm"
						variant="light"
						isIconOnly
						aria-label="Página anterior"
						isDisabled={currentPage <= 1}
						onPress={() => setPage(currentPage - 1)}
					>
						<ChevronLeft size={16} />
					</Button>
					{pageNumbers.map((num, i) =>
						num === "…" ? (
							<span key={`gap-${i}`} className="px-1">
								…
							</span>
						) : (
							<Button
								key={num}
								size="sm"
								variant={num === currentPage ? "flat" : "light"}
								color={num === currentPage ? "success" : "default"}
								className={num === currentPage ? "font-bold" : ""}
								onPress={() => setPage(num)}
							>
								{num}
							</Button>
						),
					)}
					<Button
						size="sm"
						variant="light"
						isIconOnly
						aria-label="Próxima página"
						isDisabled={currentPage >= totalPages}
						onPress={() => setPage(currentPage + 1)}
					>
						<ChevronRight size={16} />
					</Button>
				</div>
			</div>
		</div>
	)
}
