"use client"

import { Avatar, Button, Chip } from "@nextui-org/react"
import {
	CalendarDays,
	Check,
	CircleUserRound,
	LogOut,
	Mail,
	ShieldCheck,
	Sparkles,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { logoutAction } from "@/features/auth"
import {
	createBillingPortalSession,
	createPlusCheckoutSession,
} from "@/features/billing/checkout"

type UserType = {
	id: string
	email: string
	name: string | null
	createdAt?: Date
}

type ProfileContentProps = {
	user: UserType | null
	billingState: {
		plan: "FREE" | "PLUS"
		hasBillingCustomer: boolean
		plusOffer: { amountCents: number; currency: string } | null
		subscription: {
			status: "ACTIVE" | "CANCELING" | "PAST_DUE" | "UNPAID" | "CANCELED"
			currentPeriodEnd: Date
			cancelAtPeriodEnd: boolean
		} | null
		features: string[]
	} | null
}

export function ProfileContent({ user, billingState }: ProfileContentProps) {
	const router = useRouter()
	const [billingError, setBillingError] = useState<string | null>(null)
	const [isBillingLoading, setIsBillingLoading] = useState(false)

	if (!user) {
		return null
	}

	const formatDate = (date?: Date) => {
		if (!date) return "N/A"
		return new Date(date).toLocaleDateString("pt-BR", {
			year: "numeric",
			month: "long",
			day: "numeric",
		})
	}

	const formatPrice = (amountCents: number, currency: string) =>
		new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(
			amountCents / 100,
		)

	const billingStatus = billingState?.subscription
		? {
				ACTIVE: { label: "Assinatura ativa", color: "success" as const },
				CANCELING: {
					label: "Encerramento agendado",
					color: "warning" as const,
				},
				PAST_DUE: { label: "Pagamento pendente", color: "warning" as const },
				UNPAID: { label: "Pagamento não realizado", color: "danger" as const },
				CANCELED: { label: "Assinatura encerrada", color: "default" as const },
			}[billingState.subscription.status]
		: { label: "Acesso ativo", color: "success" as const }
	const subscriptionDateLabel = billingState?.subscription
		? billingState.subscription.status === "CANCELED"
			? "Último período"
			: billingState.subscription.cancelAtPeriodEnd
				? "Acesso até"
				: "Próxima renovação"
		: "Renovação"

	const getInitials = (name?: string | null) => {
		if (!name) return "U"
		const parts = name.split(" ")
		if (parts.length >= 2) {
			return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
		}
		return name.substring(0, 2).toUpperCase()
	}

	const handleLogout = async () => {
		await logoutAction()
		router.push("/auth/login")
	}

	const redirectToBilling = async (
		action: () => Promise<{ success: boolean; url?: string; error?: string }>,
	) => {
		setBillingError(null)
		setIsBillingLoading(true)
		const result = await action()
		if (result.success && result.url) {
			window.location.assign(result.url)
			return
		}
		setBillingError(result.error ?? "Não foi possível iniciar o pagamento.")
		setIsBillingLoading(false)
	}

	return (
		<div className="max-w-5xl space-y-6">
			<section className="modern-card overflow-hidden">
				<div className="bg-surface-brand px-5 py-7 sm:px-8">
					<div className="flex flex-col items-center gap-5 sm:flex-row">
						<Avatar
							name={getInitials(user.name)}
							className="h-20 w-20 bg-primary text-xl font-bold text-primary-foreground"
						/>
						<div className="min-w-0 text-center sm:text-left">
							<h2 className="text-3xl font-bold tracking-[-0.03em] text-text-primary">
								{user.name || "Usuário"}
							</h2>
							<p className="mt-1 truncate text-text-secondary">{user.email}</p>
							{user.createdAt && (
								<p className="mt-2 text-sm text-text-muted">
									Membro desde {formatDate(user.createdAt)}
								</p>
							)}
						</div>
					</div>
				</div>
			</section>

			<div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(17rem,1fr)]">
				<section className="modern-card p-5 sm:p-6">
					<div className="flex items-start justify-between gap-4">
						<div>
							<h3 className="text-xl font-semibold tracking-[-0.02em] text-text-primary">
								Vero {billingState?.plan === "PLUS" ? "Plus" : "Gratuito"}
							</h3>
							<p className="mt-1 max-w-lg text-sm leading-6 text-text-secondary">
								{billingState?.plan === "PLUS"
									? "Seu planejamento financeiro conta com os recursos habilitados do Vero Plus."
									: billingState?.plusOffer
										? "Seu plano atual cobre o essencial. O Plus amplia seu acompanhamento financeiro."
										: "Seu plano atual cobre o essencial para organizar sua vida financeira."}
							</p>
						</div>
						<Chip
							color={billingStatus.color}
							variant="flat"
							className="shrink-0"
						>
							{billingStatus.label}
						</Chip>
					</div>

					<div className="mt-6 grid gap-3 border-y border-border py-5 sm:grid-cols-2">
						<div>
							<p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
								Plano atual
							</p>
							<p className="mt-1 font-semibold text-text-primary">
								{billingState?.plan === "PLUS" ? "Vero Plus" : "Vero Gratuito"}
							</p>
						</div>
						<div>
							<p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
								{subscriptionDateLabel}
							</p>
							<p className="mt-1 font-semibold text-text-primary">
								{billingState?.subscription
									? formatDate(billingState.subscription.currentPeriodEnd)
									: "Sem renovação"}
							</p>
						</div>
					</div>

					<div className="mt-5">
						<p className="text-sm font-semibold text-text-primary">
							Recursos incluídos
						</p>
						<ul className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-2">
							{billingState?.features.map((feature) => (
								<li
									key={feature}
									className="flex items-start gap-2 text-sm leading-5 text-text-secondary"
								>
									<Check
										className="mt-0.5 h-4 w-4 shrink-0 text-primary"
										aria-hidden="true"
									/>
									{feature}
								</li>
							))}
						</ul>
					</div>

					<div className="mt-5 flex flex-col gap-3 sm:flex-row">
						{billingState?.plan === "PLUS" ? (
							<Button
								color="primary"
								onPress={() => redirectToBilling(createBillingPortalSession)}
								isLoading={isBillingLoading}
							>
								Gerenciar assinatura
							</Button>
						) : (
							<Button
								color="primary"
								onPress={() => redirectToBilling(createPlusCheckoutSession)}
								isLoading={isBillingLoading}
								isDisabled={!billingState?.plusOffer}
							>
								{billingState?.plusOffer
									? `Assinar Vero Plus por ${formatPrice(billingState.plusOffer.amountCents, billingState.plusOffer.currency)}/mês`
									: "Vero Plus indisponível"}
							</Button>
						)}
						{billingState?.hasBillingCustomer &&
							billingState.plan !== "PLUS" && (
								<Button
									variant="flat"
									onPress={() => redirectToBilling(createBillingPortalSession)}
									disabled={isBillingLoading}
								>
									Gerenciar cobrança
								</Button>
							)}
					</div>
					{billingError && (
						<p className="mt-3 text-sm text-danger">{billingError}</p>
					)}
				</section>

				<div className="space-y-6">
					<section className="modern-card p-5 sm:p-6">
						<h3 className="text-lg font-semibold text-text-primary">
							Dados da conta
						</h3>
						<dl className="mt-4 divide-y divide-border">
							<div className="flex gap-3 py-3 first:pt-0">
								<CircleUserRound
									className="h-5 w-5 shrink-0 text-primary"
									aria-hidden="true"
								/>
								<div className="min-w-0">
									<dt className="text-xs font-semibold uppercase tracking-wide text-text-muted">
										Nome
									</dt>
									<dd className="mt-1 truncate font-medium text-text-primary">
										{user.name || "Não informado"}
									</dd>
								</div>
							</div>
							<div className="flex gap-3 py-3">
								<Mail
									className="h-5 w-5 shrink-0 text-primary"
									aria-hidden="true"
								/>
								<div className="min-w-0">
									<dt className="text-xs font-semibold uppercase tracking-wide text-text-muted">
										Email
									</dt>
									<dd className="mt-1 truncate font-medium text-text-primary">
										{user.email}
									</dd>
								</div>
							</div>
							<div className="flex gap-3 py-3 last:pb-0">
								<CalendarDays
									className="h-5 w-5 shrink-0 text-primary"
									aria-hidden="true"
								/>
								<div>
									<dt className="text-xs font-semibold uppercase tracking-wide text-text-muted">
										Cadastro
									</dt>
									<dd className="mt-1 font-medium text-text-primary">
										{formatDate(user.createdAt)}
									</dd>
								</div>
							</div>
						</dl>
					</section>

					<section className="rounded-card bg-text-primary p-5 text-primary-foreground shadow-surface sm:p-6">
						<Sparkles className="h-5 w-5 text-accent" aria-hidden="true" />
						<h3 className="mt-4 text-lg font-semibold">
							Sua conta está protegida
						</h3>
						<p className="mt-2 text-sm leading-6 text-primary-foreground/80">
							Seus dados financeiros permanecem vinculados à sua conta Vero.
						</p>
					</section>
				</div>
			</div>

			<section className="flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex items-start gap-3">
					<ShieldCheck
						className="mt-0.5 h-5 w-5 shrink-0 text-positive"
						aria-hidden="true"
					/>
					<p className="max-w-xl text-sm leading-6 text-text-secondary">
						Para alterar suas informações pessoais ou excluir sua conta, entre
						em contato com o suporte.
					</p>
				</div>
				<Button
					color="danger"
					variant="flat"
					className="shrink-0"
					startContent={<LogOut className="w-4 h-4" />}
					onPress={handleLogout}
				>
					Sair da Conta
				</Button>
			</section>
		</div>
	)
}
