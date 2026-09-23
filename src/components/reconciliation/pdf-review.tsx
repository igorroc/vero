"use client"

import { Button, Card, CardBody, Chip } from "@nextui-org/react"
import { Trash2 } from "lucide-react"
import type { PdfTx } from "@/features/reconciliation/parsers/pdf"
import { parseBRMoneyToCents } from "@/features/reconciliation/parsers/normalize"

function centsToInput(cents: number): string {
	return (cents / 100).toFixed(2)
}

interface PdfReviewProps {
	transactions: PdfTx[]
	model: string
	onChange: (transactions: PdfTx[]) => void
	onConfirm: () => void
	onDiscard: () => void
	loading: boolean
}

export function PdfReview({
	transactions,
	model,
	onChange,
	onConfirm,
	onDiscard,
	loading,
}: PdfReviewProps) {
	const pending = transactions.filter((tx) => tx.needsReview)

	function patch(index: number, value: Partial<PdfTx>) {
		onChange(
			transactions.map((tx, i) => (i === index ? { ...tx, ...value } : tx)),
		)
	}

	function handleAmount(index: number, raw: string) {
		const cents = parseBRMoneyToCents(raw)
		if (cents === null || cents === 0) return
		patch(index, { amountCents: cents, needsReview: false })
	}

	return (
		<Card>
			<CardBody className="flex flex-col gap-3">
				<div className="flex items-center gap-2 flex-wrap">
					<Chip size="sm" color="secondary" variant="flat">
						Extraído via IA · {model}
					</Chip>
					<span className="text-sm text-slate-500">
						{pending.length} de {transactions.length} linhas precisam de revisão
					</span>
				</div>

				{pending.length === 0 ? (
					<p className="text-sm text-slate-500">
						Todas as linhas com boa confiança. Confira e compare.
					</p>
				) : (
					pending.map((tx) => {
						const index = transactions.indexOf(tx)
						return (
							<div
								key={`${tx.date}-${tx.amountCents}-${index}`}
								className="flex flex-col gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/30"
							>
								<p className="text-sm font-medium text-slate-900 dark:text-white">
									{tx.description}
								</p>
								<div className="flex flex-col sm:flex-row gap-2">
									<label className="flex flex-col gap-1 text-xs text-slate-500 flex-1">
										Data
										<input
											type="date"
											value={tx.date}
											onChange={(event) =>
												patch(index, {
													date: event.target.value,
													needsReview: false,
												})
											}
											className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
										/>
									</label>
									<label className="flex flex-col gap-1 text-xs text-slate-500 flex-1">
										Valor (R$)
										<input
											inputMode="decimal"
											defaultValue={centsToInput(tx.amountCents)}
											onBlur={(event) =>
												handleAmount(index, event.target.value)
											}
											className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
										/>
									</label>
									<div className="flex items-end">
										<Button
											size="sm"
											variant="light"
											color="danger"
											startContent={<Trash2 size={14} />}
											onPress={() =>
												onChange(transactions.filter((_, i) => i !== index))
											}
										>
											Remover
										</Button>
									</div>
								</div>
							</div>
						)
					})
				)}

				<div className="flex gap-2">
					<Button color="primary" isLoading={loading} onPress={onConfirm}>
						Comparar
					</Button>
					<Button variant="light" onPress={onDiscard}>
						Descartar extração
					</Button>
				</div>
			</CardBody>
		</Card>
	)
}
