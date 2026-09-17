"use client"

import { Button, Input, Switch } from "@nextui-org/react"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"

import {
	updatePlanCapability,
	type PlanCapabilityConfiguration,
} from "@/features/admin"

const planLabels = { FREE: "Vero Gratuito", PLUS: "Vero Plus" } as const

export function PlanCapabilitiesContent({
	configurations,
}: {
	configurations: PlanCapabilityConfiguration[]
}) {
	const router = useRouter()
	const [isPending, startTransition] = useTransition()
	const [items, setItems] = useState(configurations)
	const [error, setError] = useState<string | null>(null)

	function updateItem(
		index: number,
		changes: Partial<PlanCapabilityConfiguration>,
	) {
		setItems((current) =>
			current.map((item, itemIndex) =>
				itemIndex === index ? { ...item, ...changes } : item,
			),
		)
	}

	function save(item: PlanCapabilityConfiguration) {
		setError(null)
		startTransition(() => {
			void updatePlanCapability({
				plan: item.plan,
				capability: item.capability,
				isEnabled: item.isEnabled,
				limit: item.type === "LIMIT" ? item.limit : null,
			}).then((result) => {
				if (!result.success) {
					setError(result.error ?? "Não foi possível salvar a capacidade.")
					return
				}
				router.refresh()
			})
		})
	}

	return (
		<div className="space-y-6">
			<div>
				<h2 className="font-semibold text-text-primary">
					Capacidades por plano
				</h2>
				<p className="mt-1 text-sm text-text-muted">
					Defina o acesso e os limites aplicados em cada plano.
				</p>
			</div>
			{(["FREE", "PLUS"] as const).map((plan) => (
				<div key={plan} className="modern-card overflow-hidden">
					<div className="border-b border-border px-5 py-4">
						<h3 className="font-semibold text-text-primary">
							{planLabels[plan]}
						</h3>
					</div>
					<div className="divide-y divide-border">
						{items.map((item, index) => {
							if (item.plan !== plan) return null
							return (
								<div
									key={item.capability}
									className="grid gap-4 px-5 py-4 md:grid-cols-[minmax(0,1fr)_180px_100px] md:items-center"
								>
									<div>
										<p className="font-medium text-text-primary">
											{item.description}
										</p>
										<p className="mt-0.5 font-mono text-xs text-text-muted">
											{item.capability}
										</p>
									</div>
									<div className="flex items-center gap-4">
										<Switch
											isSelected={item.isEnabled}
											onValueChange={(isEnabled) =>
												updateItem(index, { isEnabled })
											}
										>
											Ativada
										</Switch>
										{item.type === "LIMIT" && (
											<Input
												aria-label={`Limite de ${item.description}`}
												type="number"
												min="0"
												placeholder="Ilimitado"
												value={item.limit?.toString() ?? ""}
												onValueChange={(value) =>
													updateItem(index, {
														limit:
															value === "" ? null : Number.parseInt(value, 10),
													})
												}
											/>
										)}
									</div>
									<Button
										size="sm"
										color="primary"
										onPress={() => save(item)}
										isLoading={isPending}
									>
										Salvar
									</Button>
								</div>
							)
						})}
					</div>
				</div>
			))}
			{error && <p className="text-sm text-danger">{error}</p>}
		</div>
	)
}
