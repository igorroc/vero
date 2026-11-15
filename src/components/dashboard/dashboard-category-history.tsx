"use client"

import { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Autocomplete, AutocompleteItem, Chip } from "@nextui-org/react"
import {
	CartesianGrid,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts"
import { getCategories } from "@/features/categories/get-categories"
import { getCategoryHistory } from "@/features/dashboard"
import { formatCurrency } from "@/types/finance"
import styles from "./dashboard-overview.module.css"

const colors = ["#087d68", "#4672c4", "#a06424"]

function formatMonth(value: string) {
	return new Intl.DateTimeFormat("pt-BR", {
		month: "short",
		year: "2-digit",
		timeZone: "UTC",
	})
		.format(new Date(`${value}-01T00:00:00Z`))
		.replace(" de ", "/")
}

export function DashboardCategoryHistory() {
	const [selected, setSelected] = useState<string[]>([])
	const [search, setSearch] = useState("")
	const [restoredKey, setRestoredKey] = useState<string | null>(null)
	const categoriesQuery = useQuery({
		queryKey: ["categories"],
		queryFn: async () => {
			const result = await getCategories()
			if (!result.success) throw new Error(result.error)
			return result.categories
		},
		staleTime: 5 * 60 * 1000,
	})
	const categories = categoriesQuery.data
	const storageKey = categories
		? `vero:category-history:${categories
				.map((category) => category.id)
				.sort()
				.join(",")}`
		: null
	useEffect(() => {
		if (!storageKey || !categories) return
		let saved: unknown = null
		try {
			saved = JSON.parse(localStorage.getItem(storageKey) ?? "null")
		} catch {
			saved = null
		}
		const validIds = new Set(categories.map((category) => category.id))
		setSelected(
			Array.isArray(saved)
				? Array.from(
						new Set(
							saved.filter(
								(id): id is string =>
									typeof id === "string" && validIds.has(id),
							),
						),
					).slice(0, 3)
				: [],
		)
		setRestoredKey(storageKey)
	}, [storageKey, categories])
	const selectionReady = storageKey !== null && restoredKey === storageKey
	const historyQuery = useQuery({
		queryKey: ["category-history", selected],
		queryFn: async () => {
			const result = await getCategoryHistory(selected)
			if (!result.success) throw new Error(result.error)
			return result.data
		},
		enabled: selectionReady && selected.length > 0,
		staleTime: 5 * 60 * 1000,
	})
	const toggleCategory = (id: string) => {
		const next = selected.includes(id)
			? selected.filter((value) => value !== id)
			: [...selected, id].slice(0, 3)
		setSelected(next)
		if (storageKey) {
			try {
				localStorage.setItem(storageKey, JSON.stringify(next))
			} catch {}
		}
	}
	const history = historyQuery.data
	const hasValues = history?.months.some((month) =>
		Object.values(month.totals).some((value) => value > 0),
	)
	return (
		<section
			className={styles.section}
			aria-labelledby="category-history-title"
		>
			<div className={styles.sectionHeading}>
				<h2 id="category-history-title">Evolução por categoria</h2>
			</div>
			<p className={styles.budgetNote}>
				Últimos 6 meses, incluindo o atual. Apenas lançamentos confirmados,
				independentemente do mês selecionado no dashboard.
			</p>
			{categoriesQuery.isPending ? (
				<p role="status" className={styles.historyMessage}>
					Carregando categorias…
				</p>
			) : categoriesQuery.isError ? (
				<div className={styles.historyMessage} role="alert">
					<p>{categoriesQuery.error.message}</p>
					<button
						type="button"
						className={styles.textLink}
						onClick={() => void categoriesQuery.refetch()}
					>
						Tentar novamente
					</button>
				</div>
			) : !categories?.length ? (
				<p className={styles.historyMessage}>
					Cadastre categorias para acompanhar sua evolução.
				</p>
			) : (
				<>
					<fieldset
						className={styles.categoryPicker}
						disabled={!selectionReady}
					>
						<legend>
							Selecione até 3 categorias <span>({selected.length}/3)</span>
						</legend>
						<Autocomplete
							aria-label="Pesquisar e adicionar categoria"
							placeholder={
								selected.length >= 3
									? "Limite de 3 categorias atingido"
									: "Pesquisar categoria…"
							}
							variant="bordered"
							inputValue={search}
							onInputChange={setSearch}
							selectedKey={null}
							isDisabled={!selectionReady || selected.length >= 3}
							onSelectionChange={(key) => {
								if (key === null || selected.length >= 3) return
								const id = String(key)
								if (
									!categories.some((category) => category.id === id) ||
									selected.includes(id)
								)
									return
								toggleCategory(id)
								setSearch("")
							}}
							defaultFilter={(text, input) =>
								text
									.normalize("NFD")
									.replace(/[\u0300-\u036f]/g, "")
									.toLocaleLowerCase("pt-BR")
									.includes(
										input
											.normalize("NFD")
											.replace(/[\u0300-\u036f]/g, "")
											.toLocaleLowerCase("pt-BR"),
									)
							}
							listboxProps={{ emptyContent: "Nenhuma categoria encontrada" }}
						>
							{categories
								.filter((category) => !selected.includes(category.id))
								.map((category) => (
									<AutocompleteItem
										key={category.id}
										textValue={`${category.name} — ${category.categoryGroup.name}`}
									>
										<div>
											<span>{category.name}</span>
											<p className="text-xs text-text-secondary">
												{category.categoryGroup.name}
											</p>
										</div>
									</AutocompleteItem>
								))}
						</Autocomplete>
						<div
							className={styles.selectedCategories}
							aria-label="Categorias selecionadas"
						>
							{selected.map((id, index) => {
								const category = categories.find((item) => item.id === id)
								return category ? (
									<Chip
										key={id}
										variant="flat"
										onClose={() => toggleCategory(id)}
										startContent={
											<span
												className={styles.categoryDot}
												style={{ background: colors[index] }}
											/>
										}
										aria-label={`Remover categoria ${category.name}`}
									>
										{category.name}
									</Chip>
								) : null
							})}
						</div>
					</fieldset>
					{selected.length === 0 ? (
						<p className={styles.historyMessage}>
							Escolha uma categoria para ver sua evolução. Selecione até três
							para comparar.
						</p>
					) : historyQuery.isPending ? (
						<p role="status" className={styles.historyMessage}>
							Carregando evolução…
						</p>
					) : historyQuery.isError ? (
						<div className={styles.historyMessage} role="alert">
							<p>{historyQuery.error.message}</p>
							<button
								type="button"
								className={styles.textLink}
								onClick={() => void historyQuery.refetch()}
							>
								Tentar novamente
							</button>
						</div>
					) : (
						history && (
							<>
								<div
									className={styles.historyLegend}
									aria-label="Legenda do gráfico"
								>
									{history.categories.map((category, index) => (
										<span key={category.id}>
											<i style={{ background: colors[index] }} />
											{category.name}
										</span>
									))}
								</div>
								{!hasValues && (
									<p className={styles.budgetNote}>
										Nenhum lançamento confirmado nessas categorias nos últimos 6
										meses.
									</p>
								)}
								<div className={styles.historyChart}>
									<ResponsiveContainer width="100%" height="100%">
										<LineChart
											data={history.months}
											margin={{ top: 12, right: 16, bottom: 8, left: 0 }}
											accessibilityLayer
										>
											<CartesianGrid
												stroke="#e0e9e6"
												vertical={false}
												strokeDasharray="3 3"
											/>
											<XAxis
												dataKey="month"
												tickFormatter={formatMonth}
												tick={{ fill: "#536966", fontSize: 11 }}
												tickLine={false}
												axisLine={false}
												minTickGap={12}
											/>
											<YAxis
												width={70}
												domain={[0, "auto"]}
												tickFormatter={(value: number) =>
													formatCurrency(value).replace(",00", "")
												}
												tick={{ fill: "#536966", fontSize: 11 }}
												tickLine={false}
												axisLine={false}
											/>
											<Tooltip
												content={({ active, payload, label }) => {
													if (
														!active ||
														!payload?.length ||
														typeof label !== "string"
													)
														return null
													return (
														<div className={styles.historyTooltip}>
															<strong>{formatMonth(label)}</strong>
															{payload.map((entry) => (
																<p key={String(entry.name)}>
																	{entry.name}:{" "}
																	{formatCurrency(
																		typeof entry.value === "number"
																			? entry.value
																			: 0,
																	)}
																</p>
															))}
														</div>
													)
												}}
											/>
											{history.categories.map((category, index) => (
												<Line
													key={category.id}
													name={category.name}
													dataKey={(row: { totals: Record<string, number> }) =>
														row.totals[category.id] ?? 0
													}
													stroke={colors[index]}
													strokeDasharray={
														index === 1
															? "6 3"
															: index === 2
																? "2 3"
																: undefined
													}
													strokeWidth={2.5}
													dot={{ r: 3 }}
													activeDot={{ r: 5 }}
													isAnimationActive={false}
												/>
											))}
										</LineChart>
									</ResponsiveContainer>
								</div>
								<details className={styles.historyDetails}>
									<summary>Ver valores por mês</summary>
									<div className={styles.tableScroll}>
										<table className={styles.historyTable}>
											<caption className="sr-only">
												Valores realizados nos últimos seis meses
											</caption>
											<thead>
												<tr>
													<th scope="col">Mês</th>
													{history.categories.map((category) => (
														<th scope="col" key={category.id}>
															{category.name}
														</th>
													))}
												</tr>
											</thead>
											<tbody>
												{history.months.map((month) => (
													<tr key={month.month}>
														<th scope="row">{formatMonth(month.month)}</th>
														{history.categories.map((category) => (
															<td key={category.id}>
																{formatCurrency(month.totals[category.id] ?? 0)}
															</td>
														))}
													</tr>
												))}
											</tbody>
										</table>
									</div>
								</details>
							</>
						)
					)}
				</>
			)}
		</section>
	)
}
