"use client"

import { useMemo, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Select, SelectItem, Spinner } from "@nextui-org/react"
import { useQuery } from "@tanstack/react-query"
import { toast } from "react-toastify"
import { Landmark, Sparkles } from "lucide-react"
import { getAccounts } from "@/features/accounts"
import { getCategories } from "@/features/categories"
import {
	getDivergences,
	parseStatement,
	type MatchedEventInfo,
} from "@/features/reconciliation"
import type { PdfTx } from "@/features/reconciliation/parsers/pdf"
import type { Divergence, NormalizedTx } from "@/lib/engines/reconciliation"
import { AnalysisLoading } from "./analysis-loading"
import { PdfReview } from "./pdf-review"
import { ReconcileSidebar } from "./reconcile-sidebar"

import { ReconciliationSummary } from "./reconciliation-summary"
import { ReviewTable, type ReviewRow, type ReviewStatus } from "./review-table"
import { StatementDropzone } from "./statement-dropzone"

const MIN_ANALYSIS_MS = 5000
export type ReconciliationStep = "import" | "analyzing" | "review"

function statusOf(divergence: Divergence): ReviewStatus {
	if (divergence.kind === "matched") return "matched"
	if (divergence.kind === "transfer_candidate") return "unidentified"
	if (divergence.statementTx == null) return "only-vero"
	return "pending"
}

function rowKey(divergence: Divergence, index: number): string {
	const tx = divergence.statementTx
	return `${divergence.kind}-${divergence.eventId ?? tx?.fitId ?? `${tx?.date}-${tx?.amountCents}` ?? "vero"}-${index}`
}

export function ReconciliationWorkspace() {
	const [step, setStep] = useState<ReconciliationStep>("import")
	const [accountId, setAccountId] = useState("")
	const [file, setFile] = useState<File | null>(null)
	const [analyzingFile, setAnalyzingFile] = useState("")
	const [loading, setLoading] = useState(false)
	const [reviewTxs, setReviewTxs] = useState<PdfTx[] | null>(null)
	const [extractionModel, setExtractionModel] = useState("")
	const [divergences, setDivergences] = useState<Divergence[]>([])
	const [eventMap, setEventMap] = useState<Record<string, MatchedEventInfo>>({})
	const [selectedKey, setSelectedKey] = useState<string | null>(null)

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

	const rows: ReviewRow[] = useMemo(
		() =>
			divergences.map((divergence, index) => {
				const tx = divergence.statementTx
				if (tx) {
					return {
						key: rowKey(divergence, index),
						date: tx.date,
						dateIso: tx.date,
						description: tx.description,
						amountCents: tx.amountCents,
						status: statusOf(divergence),
						divergence,
					}
				}
				const event = divergence.eventId
					? eventMap[divergence.eventId]
					: undefined
				return {
					key: rowKey(divergence, index),
					date: event?.date ?? "",
					dateIso: event?.date ?? "",
					description: event?.description ?? "Lançamento sem par no extrato",
					amountCents: event?.amountCents ?? 0,
					status: "only-vero" as ReviewStatus,
					divergence,
				}
			}),
		[divergences, eventMap],
	)

	const matchedCount = rows.filter((row) => row.status === "matched").length
	const pendingCount = rows.length - matchedCount
	const selectedRow = rows.find((row) => row.key === selectedKey) ?? null

	async function runDivergences(transactions: NormalizedTx[]) {
		const result = await getDivergences({ accountId, transactions })
		if (!result.success) {
			toast.error(result.error)
			return false
		}
		setEventMap(result.events)
		setDivergences(result.divergences)
		return true
	}

	async function handleStartAnalysis() {
		if (!accountId || !file) {
			toast.error("Selecione a conta e o arquivo")
			return
		}
		const currentFile = file
		setAnalyzingFile(currentFile.name)
		setStep("analyzing")
		setLoading(true)
		try {
			const formData = new FormData()
			formData.set("accountId", accountId)
			formData.set("file", currentFile)
			// Etapa de análise sempre visível por no mínimo 5s
			const [parsed] = await Promise.all([
				parseStatement(formData),
				new Promise((resolve) => setTimeout(resolve, MIN_ANALYSIS_MS)),
			])
			if (!parsed.success) {
				toast.error(parsed.error)
				setStep("import")
				return
			}
			setReviewTxs(null)
			// PDF via IA com baixa confiança passa por revisão antes de comparar
			if (
				parsed.source === "pdf" &&
				(parsed.transactions as PdfTx[]).some((tx) => tx.needsReview)
			) {
				setReviewTxs(parsed.transactions as PdfTx[])
				setExtractionModel(parsed.model ?? "")
				setStep("review")
				toast.success(
					`${parsed.transactions.length} transações extraídas via IA — revise as linhas marcadas`,
				)
				return
			}
			const ok = await runDivergences(parsed.transactions)
			if (!ok) {
				setStep("import")
				return
			}
			setSelectedKey(null)
			setStep("review")
			const ignored = parsed.skipped
			toast.success(
				`${parsed.transactions.length} transações analisadas` +
					(ignored > 0 ? ` (${ignored} ignoradas)` : ""),
			)
		} finally {
			setLoading(false)
		}
	}

	async function handleConfirmReview() {
		if (!reviewTxs) return
		setLoading(true)
		try {
			const ok = await runDivergences(reviewTxs)
			if (!ok) return
			setReviewTxs(null)
			setSelectedKey(null)
			toast.success(`${reviewTxs.length} transações analisadas`)
		} finally {
			setLoading(false)
		}
	}

	function handleResolved(target: Divergence) {
		setDivergences((current) => current.filter((item) => item !== target))
		setSelectedKey(null)
	}

	function handleBackToImport() {
		setStep("import")
		setDivergences([])
		setEventMap({})
		setReviewTxs(null)
		setSelectedKey(null)
		setFile(null)
	}

	if (accountsQuery.isLoading || categoriesQuery.isLoading) {
		return (
			<div className="flex justify-center py-12">
				<Spinner label="Carregando..." />
			</div>
		)
	}

	return (
		<div className="flex flex-col gap-4 sm:gap-6">
			<AnimatePresence mode="wait">
				{step === "import" && (
					<motion.div
						key="import"
						initial={{ opacity: 0, y: 8 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -8 }}
						className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-4 sm:gap-5 sm:p-6 dark:border-slate-800 dark:bg-slate-900"
					>
						<div className="flex flex-col gap-4 lg:flex-row">
							<div className="flex-1">
								<p className="mb-1.5 text-sm font-bold text-slate-900 dark:text-white">
									Conta do extrato
								</p>
								<Select
									aria-label="Conta do extrato"
									placeholder="Selecione a conta"
									selectedKeys={accountId ? [accountId] : []}
									onSelectionChange={(keys) =>
										setAccountId(String(Array.from(keys)[0] ?? ""))
									}
									startContent={<Landmark size={16} className="shrink-0" />}
								>
									{accounts.map((account) => (
										<SelectItem key={account.id}>{account.name}</SelectItem>
									))}
								</Select>
							</div>
							<div className="flex flex-1 flex-col justify-end gap-1.5 rounded-2xl bg-teal-50 p-4 sm:flex-row sm:items-center sm:gap-3 dark:bg-teal-950/40">
								<span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-teal-100 px-3 py-1 text-xs font-bold text-teal-800 dark:bg-teal-900 dark:text-teal-200">
									<Sparkles size={13} />
									Conciliação com IA
								</span>
								<p className="text-xs leading-relaxed text-slate-600 sm:text-sm dark:text-slate-300">
									A IA da Vero identifica lançamentos e sugere correspondências
									automaticamente.
								</p>
							</div>
						</div>

						<StatementDropzone
							file={file}
							onSelect={setFile}
							onRemove={() => setFile(null)}
						/>

						<button
							type="button"
							disabled={!accountId || !file}
							onClick={handleStartAnalysis}
							className="w-full rounded-xl bg-teal-700 py-3 text-sm font-bold text-white transition-opacity disabled:opacity-40 sm:mx-auto sm:max-w-xs"
						>
							Analisar extrato
						</button>
						<p className="text-center text-[11px] text-slate-400">
							O arquivo é lido em memória e descartado — nada do extrato é
							guardado.
						</p>
					</motion.div>
				)}

				{step === "analyzing" && (
					<motion.div
						key="analyzing"
						initial={{ opacity: 0, y: 8 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -8 }}
					>
						<AnalysisLoading fileName={analyzingFile} />
					</motion.div>
				)}

				{step === "review" && (
					<motion.div
						key="review"
						initial={{ opacity: 0, y: 8 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -8 }}
						className="flex flex-col gap-4"
					>
						<ReconciliationSummary
							accounts={accounts}
							accountId={accountId}
							onAccountChange={setAccountId}
							fileName={file?.name ?? analyzingFile}
							total={rows.length}
							matched={matchedCount}
							pending={pendingCount}
						/>

						{reviewTxs && (
							<PdfReview
								transactions={reviewTxs}
								model={extractionModel}
								onChange={setReviewTxs}
								onConfirm={handleConfirmReview}
								onDiscard={() => {
									setReviewTxs(null)
									handleBackToImport()
								}}
								loading={loading}
							/>
						)}

						{!reviewTxs && (
							<div className="flex flex-col gap-4 xl:flex-row xl:items-start">
								<div className="min-w-0 flex-1">
									<ReviewTable
										rows={rows}
										selectedKey={selectedKey}
										onSelect={(row) => setSelectedKey(row?.key ?? null)}
									/>
									<button
										type="button"
										onClick={handleBackToImport}
										className="mt-3 text-xs font-semibold text-slate-500 underline-offset-2 hover:underline"
									>
										← Analisar outro extrato
									</button>
								</div>
								<div className="w-full shrink-0 xl:sticky xl:top-4 xl:w-[340px]">
									{selectedRow ? (
										<ReconcileSidebar
											row={selectedRow}
											accountId={accountId}
											accounts={accounts}
											categories={categories}
											onClose={() => setSelectedKey(null)}
											onResolved={() => handleResolved(selectedRow.divergence)}
										/>
									) : (
										<div className="hidden rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-400 xl:block dark:border-slate-700">
											Selecione um item pendente na tabela para conciliar aqui
											ao lado.
										</div>
									)}
								</div>
							</div>
						)}
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	)
}
