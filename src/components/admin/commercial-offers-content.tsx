"use client"

import { Button, Input } from "@nextui-org/react"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"

import {
	createCommercialOffer,
	deactivateCommercialOffer,
} from "@/features/admin"

type CommercialOffer = {
	id: string
	amountCents: number
	currency: string
	isActive: boolean
	effectiveAt: Date
	providerProductId: string
	providerPriceId: string
	createdAt: Date
	deactivatedAt: Date | null
	createdByUser: { name: string; email: string }
}

function formatCurrency(amountCents: number, currency: string) {
	return new Intl.NumberFormat("pt-BR", {
		style: "currency",
		currency,
	}).format(amountCents / 100)
}

function formatDate(date: Date) {
	return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(
		new Date(date),
	)
}

export function CommercialOffersContent({ offers }: { offers: CommercialOffer[] }) {
	const router = useRouter()
	const [isPending, startTransition] = useTransition()
	const [amountCents, setAmountCents] = useState(1490)
	const [currency, setCurrency] = useState("BRL")
	const [providerProductId, setProviderProductId] = useState("")
	const [providerPriceId, setProviderPriceId] = useState("")
	const [effectiveAt, setEffectiveAt] = useState(
		new Date().toISOString().slice(0, 10),
	)
	const [error, setError] = useState<string | null>(null)

	function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault()
		setError(null)
		startTransition(() => {
			void createCommercialOffer({
				amountCents,
				currency,
				providerProductId,
				providerPriceId,
				effectiveAt: new Date(`${effectiveAt}T00:00:00.000Z`).toISOString(),
			}).then((result) => {
				if (!result.success) {
					setError(result.error ?? "Não foi possível salvar a oferta.")
					return
				}
				setProviderProductId("")
				setProviderPriceId("")
				router.refresh()
			})
		})
	}

	function handleDeactivate(offerId: string) {
		setError(null)
		startTransition(() => {
			void deactivateCommercialOffer(offerId).then((result) => {
				if (!result.success) {
					setError(result.error ?? "Não foi possível desativar a oferta.")
					return
				}
				router.refresh()
			})
		})
	}

	return (
		<div className="space-y-6">
			<div className="modern-card p-5">
				<h2 className="font-semibold text-text-primary">Nova configuração do Vero Plus</h2>
				<p className="mt-1 text-sm text-text-muted">
					A nova oferta vale apenas para novas contratações. Assinaturas existentes mantêm o preço Stripe já vinculado.
				</p>
				<form className="mt-5 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
					<Input
						label="Preço mensal (centavos)"
						type="number"
						min="1"
						value={String(amountCents)}
						onValueChange={(value) => setAmountCents(Number(value))}
						isRequired
					/>
					<Input
						label="Moeda"
						maxLength={3}
						value={currency}
						onValueChange={setCurrency}
						isRequired
					/>
					<Input
						label="ID do produto Stripe"
						placeholder="prod_..."
						value={providerProductId}
						onValueChange={setProviderProductId}
						isRequired
					/>
					<Input
						label="ID do preço Stripe"
						placeholder="price_..."
						value={providerPriceId}
						onValueChange={setProviderPriceId}
						isRequired
					/>
					<Input
						label="Início da vigência"
						type="date"
						value={effectiveAt}
						onValueChange={setEffectiveAt}
						isRequired
					/>
					<div className="flex items-end">
						<Button color="primary" type="submit" isLoading={isPending}>
							Salvar oferta
						</Button>
					</div>
				</form>
				{error && <p className="mt-3 text-sm text-danger">{error}</p>}
			</div>

			<div className="modern-card overflow-hidden">
				<div className="border-b border-border px-5 py-4">
					<h2 className="font-semibold text-text-primary">Histórico de ofertas</h2>
				</div>
				<div className="overflow-x-auto">
					<table className="min-w-[900px] w-full text-left text-sm">
						<thead className="bg-surface-muted text-xs uppercase tracking-wide text-text-muted">
							<tr>
								<th className="px-5 py-3 font-semibold">Preço</th>
								<th className="px-5 py-3 font-semibold">Vigência</th>
								<th className="px-5 py-3 font-semibold">Produto Stripe</th>
								<th className="px-5 py-3 font-semibold">Preço Stripe</th>
								<th className="px-5 py-3 font-semibold">Configurado por</th>
								<th className="px-5 py-3 font-semibold">Situação</th>
								<th className="px-5 py-3 font-semibold" />
							</tr>
						</thead>
						<tbody className="divide-y divide-border">
							{offers.map((offer) => (
								<tr key={offer.id} className="text-text-primary">
									<td className="px-5 py-4 font-medium">{formatCurrency(offer.amountCents, offer.currency)}</td>
									<td className="px-5 py-4 text-text-muted">{formatDate(offer.effectiveAt)}</td>
									<td className="px-5 py-4 font-mono text-xs">{offer.providerProductId}</td>
									<td className="px-5 py-4 font-mono text-xs">{offer.providerPriceId}</td>
									<td className="px-5 py-4 text-text-muted">{offer.createdByUser.name}</td>
									<td className="px-5 py-4">
										<span className={offer.isActive ? "text-success" : "text-text-muted"}>
											{offer.isActive ? "Ativa" : "Inativa"}
										</span>
									</td>
									<td className="px-5 py-4">
										{offer.isActive && (
											<Button size="sm" color="danger" variant="light" onPress={() => handleDeactivate(offer.id)} isDisabled={isPending}>
												Desativar
											</Button>
										)}
									</td>
								</tr>
							))}
							{offers.length === 0 && (
								<tr><td colSpan={7} className="px-5 py-8 text-center text-text-muted">Nenhuma oferta configurada.</td></tr>
							)}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	)
}
