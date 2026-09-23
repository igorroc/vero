"use client"

import { useMemo, useState } from "react"
import {
	Button,
	Card,
	CardBody,
	Chip,
	Select,
	SelectItem,
	Spinner,
} from "@nextui-org/react"
import { useQuery } from "@tanstack/react-query"
import { toast } from "react-toastify"
import { Upload } from "lucide-react"
import { getAccounts } from "@/features/accounts"
import { getCategories } from "@/features/categories"
import { getDivergences, parseStatement } from "@/features/reconciliation"
import type { Divergence } from "@/lib/engines/reconciliation"
import { DivergenceRow } from "./divergence-row"

type Filter = "all" | Divergence["kind"]

const FILTERS: Array<{ key: Filter; label: string }> = [
	{ key: "all", label: "Todas" },
	{ key: "missing_in_vero", label: "Só no extrato" },
	{ key: "transfer_candidate", label: "Transferências?" },
	{ key: "missing_in_statement", label: "Só no Vero" },
	{ key: "value_mismatch", label: "Valor difere" },
	{ key: "matched", label: "Conciliadas" },
]

export function ReconciliationWorkspace() {
	const [accountId, setAccountId] = useState("")
	const [file, setFile] = useState<File | null>(null)
	const [startDate, setStartDate] = useState("")
	const [endDate, setEndDate] = useState("")
	const [loading, setLoading] = useState(false)
	const [compared, setCompared] = useState(false)
	const [skipped, setSkipped] = useState(0)
	const [divergences, setDivergences] = useState<Divergence[]>([])
	const [filter, setFilter] = useState<Filter>("all")

	const accountsQuery = useQuery({
		queryKey: ["accounts"],
		queryFn: async () => {
			const result = await getAccounts()
			if (!result.success) throw new Error(result.error)
			return result.accounts
		},
		staleTime: 5 * 60 * 1000,
	})
	const categoriesQuery = useQuery({
		queryKey: ["categories"],
		queryFn: async () => {
			const result = await getCategories()
			if (!result.success) throw new Error(result.error)
			return result.categories
		},
		staleTime: 5 * 60 * 1000,
	})
	const accounts = accountsQuery.data ?? []
	const categories = categoriesQuery.data ?? []

	const counts = useMemo(() => {
		const map: Record<Divergence["kind"], number> = {
			matched: 0,
			missing_in_vero: 0,
			missing_in_statement: 0,
			value_mismatch: 0,
			transfer_candidate: 0,
		}
		for (const divergence of divergences) map[divergence.kind] += 1
		return map
	}, [divergences])

	const visible = useMemo(
		() =>
			filter === "all"
				? divergences
				: divergences.filter((divergence) => divergence.kind === filter),
		[divergences, filter],
	)

	async function handleCompare() {
		if (!accountId || !file) {
			toast.error("Selecione a conta e o arquivo")
			return
		}
		setLoading(true)
		try {
			const formData = new FormData()
			formData.set("accountId", accountId)
			formData.set("file", file)
			const parsed = await parseStatement(formData)
			if (!parsed.success) {
				toast.error(parsed.error)
				return
			}
			setSkipped(parsed.skipped)
			const result = await getDivergences({
				accountId,
				transactions: parsed.transactions,
				...(startDate ? { startDate } : {}),
				...(endDate ? { endDate } : {}),
			})
			if (!result.success) {
				toast.error(result.error)
				return
			}
			setDivergences(result.divergences)
			setCompared(true)
			setFilter("all")
			toast.success(
				`${parsed.transactions.length} transações comparadas` +
					(parsed.skipped > 0 ? ` (${parsed.skipped} ignoradas)` : ""),
			)
		} finally {
			setLoading(false)
		}
	}

	function handleResolved(target: Divergence) {
		setDivergences((current) => current.filter((item) => item !== target))
	}

	if (accountsQuery.isLoading || categoriesQuery.isLoading) {
		return (
			<div className="flex justify-center py-12">
				<Spinner label="Carregando..." />
			</div>
		)
	}

	return (
		<div className="flex flex-col gap-4">
			<Card>
				<CardBody className="flex flex-col gap-3">
					<Select
						label="Conta"
						placeholder="Selecione a conta do extrato"
						selectedKeys={accountId ? [accountId] : []}
						onSelectionChange={(keys) =>
							setAccountId(String(Array.from(keys)[0] ?? ""))
						}
					>
						{accounts.map((account) => (
							<SelectItem key={account.id}>{account.name}</SelectItem>
						))}
					</Select>
					<label className="flex flex-col gap-1 text-sm text-slate-600 dark:text-slate-300">
						Extrato (CSV ou OFX, até 10MB)
						<input
							type="file"
							accept=".csv,.ofx"
							onChange={(event) => setFile(event.target.files?.[0] ?? null)}
							className="text-sm text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-slate-200 dark:file:bg-slate-800"
						/>
					</label>
					<div className="flex flex-col sm:flex-row gap-2">
						<label className="flex flex-col gap-1 text-sm text-slate-600 dark:text-slate-300 flex-1">
							Início (opcional)
							<input
								type="date"
								value={startDate}
								onChange={(event) => setStartDate(event.target.value)}
								className="rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-sm dark:border-slate-700"
							/>
						</label>
						<label className="flex flex-col gap-1 text-sm text-slate-600 dark:text-slate-300 flex-1">
							Fim (opcional)
							<input
								type="date"
								value={endDate}
								onChange={(event) => setEndDate(event.target.value)}
								className="rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-sm dark:border-slate-700"
							/>
						</label>
					</div>
					<p className="text-xs text-slate-500">
						O arquivo é lido em memória e descartado — nada do extrato é
						guardado.{" "}
						{skipped > 0 && compared && `${skipped} linhas ignoradas.`}
					</p>
					<div>
						<Button
							color="primary"
							startContent={<Upload size={16} />}
							isLoading={loading}
							isDisabled={!accountId || !file}
							onPress={handleCompare}
						>
							Comparar extrato
						</Button>
					</div>
				</CardBody>
			</Card>

			{compared && (
				<>
					<div className="flex flex-wrap gap-2">
						{FILTERS.map(({ key, label }) => (
							<Chip
								key={key}
								as="button"
								onClick={() => setFilter(key)}
								color={filter === key ? "primary" : "default"}
								variant={filter === key ? "solid" : "flat"}
								className="cursor-pointer"
							>
								{label}
								{key !== "all"
									? ` (${counts[key as Divergence["kind"]]})`
									: ` (${divergences.length})`}
							</Chip>
						))}
					</div>

					{visible.length === 0 ? (
						<Card>
							<CardBody>
								<p className="text-sm text-slate-500">
									Nenhuma divergência neste filtro. Tudo conciliado.
								</p>
							</CardBody>
						</Card>
					) : (
						visible.map((divergence, index) => (
							<DivergenceRow
								key={`${divergence.kind}-${divergence.eventId ?? divergence.statementTx?.fitId ?? `${divergence.statementTx?.date}-${divergence.statementTx?.amountCents}`}-${index}`}
								divergence={divergence}
								accountId={accountId}
								accounts={accounts}
								categories={categories}
								onResolved={() => handleResolved(divergence)}
							/>
						))
					)}
				</>
			)}
		</div>
	)
}
