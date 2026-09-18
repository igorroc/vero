"use client"

import { Button } from "@nextui-org/react"
import {
	ArrowUpRight,
	CalendarClock,
	Check,
	ChevronDown,
	CircleCheck,
	Landmark,
	ShieldCheck,
	Tags,
	X,
} from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { useQuery } from "@tanstack/react-query"

import {
	dismissOnboarding,
	getOnboardingState,
	startLimitPreview,
	type OnboardingProgress,
} from "@/features/onboarding"

type OnboardingChecklistProps = {
	onPreviewStarted: () => void
}

const steps: Record<
	OnboardingProgress["steps"][number]["id"],
	{
		title: string
		description: string
		href: string
		cta: string
		icon: typeof Landmark
	}
> = {
	account: {
		title: "Adicione sua conta principal",
		description: "Informe o saldo que você tem disponível hoje.",
		href: "/accounts",
		cta: "Criar conta",
		icon: Landmark,
	},
	categories: {
		title: "Organize receitas e gastos",
		description: "Crie uma categoria para renda e outra para despesas.",
		href: "/categories",
		cta: "Criar categorias",
		icon: Tags,
	},
	settings: {
		title: "Defina sua reserva de segurança",
		description: "Escolha o valor que não deve ser comprometido.",
		href: "/settings",
		cta: "Configurar reserva",
		icon: ShieldCheck,
	},
	plan: {
		title: "Planeje o próximo ciclo",
		description: "Registre sua próxima receita e uma despesa importante.",
		href: "/events",
		cta: "Adicionar lançamentos",
		icon: CalendarClock,
	},
}

export function OnboardingChecklist({
	onPreviewStarted,
}: OnboardingChecklistProps) {
	const [hasReopened, setHasReopened] = useState(false)
	const [isClaimingPreview, setIsClaimingPreview] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const onboardingQuery = useQuery({
		queryKey: ["onboarding"],
		queryFn: async () => {
			const result = await getOnboardingState()
			if (!result.success) throw new Error(result.error)
			return result.onboarding
		},
		staleTime: 30_000,
	})
	const onboarding = onboardingQuery.data

	if (!onboarding || onboarding.completed) return null
	if (onboarding.dismissed && !hasReopened) {
		return (
			<Button
				variant="light"
				size="sm"
				className="text-text-secondary"
				endContent={<ChevronDown className="h-4 w-4" />}
				onPress={() => setHasReopened(true)}
			>
				Preparar meu Vero
			</Button>
		)
	}

	const handleDismiss = async () => {
		setError(null)
		const result = await dismissOnboarding()
		if (!result.success) {
			setError(result.error)
			return
		}
		await onboardingQuery.refetch()
		setHasReopened(false)
	}

	const handleStartPreview = async () => {
		setError(null)
		setIsClaimingPreview(true)
		const result = await startLimitPreview()
		if (result.success) {
			await onboardingQuery.refetch()
			onPreviewStarted()
		} else {
			setError(result.error)
		}
		setIsClaimingPreview(false)
	}

	return (
		<section className="modern-card overflow-hidden">
			<div className="flex items-start justify-between gap-5 px-5 pb-5 pt-6 sm:px-7 sm:pb-6 sm:pt-7">
				<div className="max-w-2xl">
					<h2 className="text-xl font-semibold tracking-[-0.02em] text-text-primary sm:text-2xl">
						Construa uma visão segura do seu dinheiro
					</h2>
					<p className="mt-2 text-sm leading-6 text-text-secondary sm:text-base">
						Complete estes passos com seus dados reais. Ao final, o Vero mostra
						quanto você pode gastar sem comprometer o próximo ciclo.
					</p>
				</div>
				<Button
					isIconOnly
					variant="light"
					size="sm"
					aria-label="Fechar preparação inicial"
					onPress={handleDismiss}
				>
					<X className="h-4 w-4" />
				</Button>
			</div>

			<div className="border-t border-border px-5 sm:px-7">
				<ol className="divide-y divide-border">
					{onboarding.steps.map((step) => {
						const item = steps[step.id]
						const Icon = item.icon
						return (
							<li
								key={step.id}
								className="flex items-center gap-3 py-4 sm:gap-4"
							>
								<div
									className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
										step.completed
											? "bg-success/15 text-success"
											: "bg-surface-muted text-text-muted"
									}`}
								>
									{step.completed ? (
										<Check className="h-4 w-4" strokeWidth={2.5} />
									) : (
										<Icon className="h-4 w-4" />
									)}
								</div>
								<div className="min-w-0 flex-1">
									<p
										className={`text-sm font-semibold ${
											step.completed
												? "text-text-secondary line-through decoration-text-muted/60"
												: "text-text-primary"
										}`}
									>
										{item.title}
									</p>
									{!step.completed && (
										<p className="mt-0.5 text-xs leading-5 text-text-secondary sm:text-sm">
											{item.description}
										</p>
									)}
								</div>
								{!step.completed && (
									<Button
										as={Link}
										href={item.href}
										variant="light"
										size="sm"
										className="shrink-0 text-primary"
										endContent={<ArrowUpRight className="h-3.5 w-3.5" />}
									>
										{item.cta}
									</Button>
								)}
							</li>
						)
					})}
				</ol>
			</div>

			{onboarding.preparationComplete && (
				<div className="bg-surface-brand px-5 py-5 sm:px-7">
					<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<h3 className="font-semibold text-text-primary">
								Seu cenário está pronto para ser calculado
							</h3>
							<p className="mt-1 text-sm text-text-secondary">
								Use sua prévia gratuita para conhecer o limite seguro.
							</p>
						</div>
						{onboarding.previewAvailable ? (
							<Button
								color="primary"
								isLoading={isClaimingPreview}
								onPress={handleStartPreview}
							>
								Ver meu limite seguro
							</Button>
						) : onboarding.previewActive ? (
							<div className="flex items-center gap-2 text-sm font-medium text-success">
								<CircleCheck className="h-4 w-4" />
								Prévia ativa agora
							</div>
						) : null}
					</div>
				</div>
			)}
			{error && (
				<p className="px-5 pb-4 text-sm text-danger sm:px-7">{error}</p>
			)}
		</section>
	)
}
