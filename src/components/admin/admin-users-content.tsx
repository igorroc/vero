import type { AdminUser } from "@/features/admin"

const subscriptionStatusLabels = {
	ACTIVE: "Ativa",
	CANCELING: "Cancelamento agendado",
	PAST_DUE: "Pagamento pendente",
	UNPAID: "Não paga",
	CANCELED: "Cancelada",
} as const

const benefitSourceLabels: Record<string, string> = {
	INDIVIDUAL_SUBSCRIPTION: "Assinatura individual",
	PROFESSIONAL_SEAT: "Vaga profissional",
	SPONSORED_SEAT: "Vaga patrocinada",
	ADMINISTRATIVE_GRANT: "Cortesia administrativa",
	PROMOTION: "Promoção",
}

function formatDate(date: Date) {
	return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(date)
}

function PlanBadge({ plan }: { plan: AdminUser["plan"] }) {
	return (
		<span
			className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
				plan === "PLUS"
					? "bg-primary/15 text-primary"
					: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
			}`}
		>
			Vero {plan === "PLUS" ? "Plus" : "Gratuito"}
		</span>
	)
}

export function AdminUsersContent({ users }: { users: AdminUser[] }) {
	const plusUsers = users.filter((user) => user.plan === "PLUS").length
	const activeSubscriptions = users.filter(
		(user) =>
			user.subscription?.status === "ACTIVE" ||
			user.subscription?.status === "CANCELING",
	).length

	return (
		<div className="space-y-6">
			<div className="grid gap-4 sm:grid-cols-3">
				<div className="modern-card p-5">
					<p className="text-sm text-text-muted">Usuários cadastrados</p>
					<p className="mt-1 text-3xl font-bold text-text-primary">
						{users.length}
					</p>
				</div>
				<div className="modern-card p-5">
					<p className="text-sm text-text-muted">Com Vero Plus</p>
					<p className="mt-1 text-3xl font-bold text-primary">{plusUsers}</p>
				</div>
				<div className="modern-card p-5">
					<p className="text-sm text-text-muted">Assinaturas em vigência</p>
					<p className="mt-1 text-3xl font-bold text-text-primary">
						{activeSubscriptions}
					</p>
				</div>
			</div>

			<div className="modern-card overflow-hidden">
				<div className="border-b border-border px-5 py-4">
					<h2 className="font-semibold text-text-primary">
						Acessos e assinaturas
					</h2>
					<p className="mt-1 text-sm text-text-muted">
						O plano efetivo considera o melhor benefício ativo de cada usuário.
					</p>
				</div>
				<div className="overflow-x-auto">
					<table className="min-w-[850px] w-full text-left text-sm">
						<thead className="bg-surface-muted text-xs uppercase tracking-wide text-text-muted">
							<tr>
								<th className="px-5 py-3 font-semibold">Usuário</th>
								<th className="px-5 py-3 font-semibold">Cadastro</th>
								<th className="px-5 py-3 font-semibold">Plano efetivo</th>
								<th className="px-5 py-3 font-semibold">Origem do acesso</th>
								<th className="px-5 py-3 font-semibold">Assinatura</th>
								<th className="px-5 py-3 font-semibold">Período atual</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-border">
							{users.map((user) => (
								<tr key={user.id} className="text-text-primary">
									<td className="px-5 py-4">
										<p className="font-medium">{user.name}</p>
										<p className="mt-0.5 text-text-muted">{user.email}</p>
									</td>
									<td className="px-5 py-4 text-text-muted">
										{formatDate(user.createdAt)}
									</td>
									<td className="px-5 py-4">
										<PlanBadge plan={user.plan} />
									</td>
									<td className="px-5 py-4 text-text-muted">
										{user.benefitSource
											? benefitSourceLabels[user.benefitSource]
											: "Plano gratuito"}
									</td>
									<td className="px-5 py-4">
										{user.subscription ? (
											<div>
												<p className="font-medium">
													{subscriptionStatusLabels[user.subscription.status]}
												</p>
												{user.subscription.cancelAtPeriodEnd && (
													<p className="mt-0.5 text-text-muted">Não renovará</p>
												)}
											</div>
										) : (
											"Sem assinatura"
										)}
									</td>
									<td className="px-5 py-4 text-text-muted">
										{user.subscription
											? `Até ${formatDate(user.subscription.currentPeriodEnd)}`
											: "-"}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	)
}
