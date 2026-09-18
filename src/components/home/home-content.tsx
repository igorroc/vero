import {
	ArrowRight,
	Check,
	ChevronRight,
	CircleDollarSign,
	Landmark,
	ShieldCheck,
	WalletCards,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"

import LogoImage from "@/app/icon.png"

const timeline = [
	{
		day: "Hoje",
		detail: "Saldo confirmado",
		value: "R$ 8.420",
		tone: "text-[#123c3a]",
	},
	{
		day: "18 jun",
		detail: "Aluguel",
		value: "- R$ 1.850",
		tone: "text-[#9a483d]",
	},
	{
		day: "20 jun",
		detail: "Salário",
		value: "+ R$ 6.200",
		tone: "text-[#16755d]",
	},
	{
		day: "24 jun",
		detail: "Reserva de segurança",
		value: "R$ 4.000",
		tone: "text-[#6b654e]",
	},
]

const principles = [
	[
		"Saldo real",
		"Veja o que já aconteceu sem confundir com o que está previsto.",
	],
	["Futuro legível", "Projete entradas e saídas em 30, 60 ou 90 dias."],
	[
		"Decisão diária",
		"Transforme o cenário inteiro em um limite claro para hoje.",
	],
]

export function HomeContent({ userName }: { userName?: string }) {
	const accountHref = userName ? "/dashboard" : "/auth/register"

	return (
		<div className="min-h-screen overflow-hidden bg-[#f5f6f1] text-[#102d2c] selection:bg-[#a7dcc8] selection:text-[#102d2c]">
			<header className="border-b border-[#102d2c]/10 bg-[#f5f6f1]/95">
				<nav className="mx-auto flex h-20 max-w-[1280px] items-center justify-between px-5 sm:px-8">
					<Link
						href="/"
						className="flex items-center gap-3"
						aria-label="Vero, página inicial"
					>
						<Image src={LogoImage} alt="" className="h-9 w-9" priority />
						<span className="font-[family-name:var(--font-heading)] text-2xl font-semibold tracking-[-0.04em]">
							vero
						</span>
					</Link>
					<div className="hidden items-center gap-8 text-sm font-medium text-[#47615d] md:flex">
						<a
							href="#como-funciona"
							className="transition-colors hover:text-[#102d2c]"
						>
							Como funciona
						</a>
						<a href="#visao" className="transition-colors hover:text-[#102d2c]">
							O que você acompanha
						</a>
					</div>
					<div className="flex items-center gap-3">
						{!userName && (
							<Link
								href="/auth/login"
								className="hidden px-3 py-2 text-sm font-semibold text-[#234744] hover:text-[#102d2c] sm:block"
							>
								Entrar
							</Link>
						)}
						<Link
							href={accountHref}
							className="inline-flex items-center gap-2 rounded-full bg-[#123c3a] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0b2928]"
						>
							{userName ? "Ir para o painel" : "Começar agora"}
							<ArrowRight className="h-4 w-4" />
						</Link>
					</div>
				</nav>
			</header>

			<main>
				<section className="relative mx-auto max-w-[1280px] px-5 pb-20 pt-16 sm:px-8 lg:pb-28 lg:pt-24">
					<div className="grid items-center gap-14 lg:grid-cols-[0.92fr_1.08fr] lg:gap-12">
						<div className="max-w-[620px]">
							<h1 className="font-[family-name:var(--font-heading)] text-[clamp(3.2rem,6.5vw,6.1rem)] font-semibold leading-[0.92] tracking-[-0.06em] text-[#102d2c]">
								Seu dinheiro tem um próximo passo. Veja-o antes.
							</h1>
							<p className="mt-7 max-w-[540px] text-lg leading-8 text-[#47615d] sm:text-xl">
								O Vero transforma contas, despesas e receitas previstas em uma
								visão calma do seu futuro financeiro, incluindo quanto é seguro
								gastar hoje.
							</p>
							<div className="mt-9 flex flex-col gap-3 sm:flex-row">
								<Link
									href={accountHref}
									className="inline-flex items-center justify-center gap-2 rounded-full bg-[#d6b353] px-6 py-3.5 font-semibold text-[#102d2c] transition-colors hover:bg-[#c7a343]"
								>
									Criar minha visão financeira{" "}
									<ArrowRight className="h-4 w-4" />
								</Link>
								<a
									href="#como-funciona"
									className="inline-flex items-center justify-center gap-2 rounded-full border border-[#102d2c]/20 px-6 py-3.5 font-semibold text-[#234744] transition-colors hover:border-[#102d2c] hover:bg-white"
								>
									Entender o método <ChevronRight className="h-4 w-4" />
								</a>
							</div>
							<p className="mt-5 flex items-center gap-2 text-sm text-[#617773]">
								<Check className="h-4 w-4 text-[#16755d]" /> Sem promessa de
								mágica. Só um plano mais claro.
							</p>
						</div>

						<div className="relative mx-auto w-full max-w-[620px] lg:max-w-none">
							<div className="absolute -right-14 -top-16 h-44 w-44 rounded-full border-[22px] border-[#d6b353]/30" />
							<div className="relative rounded-[20px] bg-[#123c3a] p-3 shadow-[18px_24px_0_rgba(16,45,44,0.1)] sm:p-5">
								<div className="rounded-[12px] bg-[#f9faf5] p-5 sm:p-7">
									<div className="flex items-center justify-between border-b border-[#102d2c]/10 pb-5">
										<div>
											<p className="text-xs font-bold uppercase tracking-[0.14em] text-[#6b7f7b]">
												Junho de 2026
											</p>
											<p className="mt-1 font-[family-name:var(--font-heading)] text-2xl font-semibold tracking-[-0.04em]">
												Minha linha do tempo
											</p>
										</div>
										<div className="rounded-full bg-[#e3eee6] px-3 py-1.5 text-xs font-bold text-[#16755d]">
											Tudo sob controle
										</div>
									</div>
									<div className="mt-6 grid gap-4 sm:grid-cols-[1fr_0.82fr]">
										<div className="rounded-xl bg-[#e9efea] p-5">
											<p className="text-sm font-medium text-[#58706b]">
												Você pode gastar hoje
											</p>
											<p className="mt-2 font-[family-name:var(--font-heading)] text-4xl font-semibold tracking-[-0.05em] text-[#102d2c]">
												R$ 184<span className="text-xl">,00</span>
											</p>
											<div className="mt-5 h-2 overflow-hidden rounded-full bg-[#cad8ce]">
												<div className="h-full w-[68%] rounded-full bg-[#16755d]" />
											</div>
											<p className="mt-2 text-xs text-[#58706b]">
												Considerando sua reserva e próximos compromissos
											</p>
										</div>
										<div className="border-l border-[#102d2c]/10 pl-4 sm:pl-5">
											<p className="text-sm font-medium text-[#58706b]">
												Até o fim do mês
											</p>
											<p className="mt-2 text-2xl font-bold tracking-[-0.04em] text-[#16755d]">
												+ R$ 2.110
											</p>
											<p className="mt-1 text-xs leading-5 text-[#58706b]">
												Projeção líquida, com eventos planejados.
											</p>
										</div>
									</div>
									<div className="mt-6 divide-y divide-[#102d2c]/10 border-t border-[#102d2c]/10">
										{timeline.map((item) => (
											<div
												key={item.day}
												className="grid grid-cols-[54px_1fr_auto] items-center gap-3 py-3.5 text-sm"
											>
												<span className="font-semibold text-[#47615d]">
													{item.day}
												</span>
												<span className="text-[#58706b]">{item.detail}</span>
												<span className={`font-bold tabular-nums ${item.tone}`}>
													{item.value}
												</span>
											</div>
										))}
									</div>
								</div>
							</div>
						</div>
					</div>
				</section>

				<section
					id="visao"
					className="bg-[#123c3a] px-5 py-20 text-[#f5f6f1] sm:px-8 lg:py-28"
				>
					<div className="mx-auto grid max-w-[1280px] gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-24">
						<div>
							<h2 className="font-[family-name:var(--font-heading)] text-5xl font-semibold leading-[0.98] tracking-[-0.055em] sm:text-6xl">
								Menos adivinhação. Mais contexto.
							</h2>
							<p className="mt-7 max-w-md text-lg leading-8 text-[#bdd0c7]">
								Cada decisão diária passa a considerar o que já existe, o que
								está a caminho e o que precisa continuar protegido.
							</p>
						</div>
						<div className="divide-y divide-white/15 border-t border-white/15">
							{principles.map(([title, description], index) => (
								<div
									key={title}
									className="grid grid-cols-[42px_1fr] gap-5 py-7"
								>
									<span className="font-[family-name:var(--font-heading)] text-2xl text-[#d6b353]">
										0{index + 1}
									</span>
									<div>
										<h3 className="text-xl font-semibold">{title}</h3>
										<p className="mt-2 max-w-lg leading-7 text-[#bdd0c7]">
											{description}
										</p>
									</div>
								</div>
							))}
						</div>
					</div>
				</section>

				<section
					id="como-funciona"
					className="mx-auto max-w-[1280px] px-5 py-20 sm:px-8 lg:py-28"
				>
					<div className="max-w-2xl">
						<h2 className="font-[family-name:var(--font-heading)] text-5xl font-semibold leading-[0.98] tracking-[-0.055em] sm:text-6xl">
							A organização que abre espaço para viver.
						</h2>
						<p className="mt-6 text-lg leading-8 text-[#47615d]">
							O Vero segue a lógica das suas finanças reais, não uma planilha
							que você abandona na segunda semana.
						</p>
					</div>
					<div className="mt-14 grid gap-px overflow-hidden rounded-2xl bg-[#102d2c]/15 md:grid-cols-3">
						{[
							[
								Landmark,
								"Comece pelas contas",
								"Registre contas bancárias, dinheiro e investimentos com seus saldos atuais.",
							],
							[
								WalletCards,
								"Inclua o que já sabe",
								"Adicione salário, aluguel, assinaturas e outras movimentações futuras.",
							],
							[
								CircleDollarSign,
								"Decida com segurança",
								"Acompanhe o fluxo projetado e veja seu limite diário de gastos.",
							],
						].map(([Icon, title, description]) => {
							const FeatureIcon = Icon as typeof Landmark
							return (
								<div key={title as string} className="bg-[#f5f6f1] p-7 sm:p-9">
									<FeatureIcon className="h-7 w-7 text-[#16755d]" />
									<h3 className="mt-14 text-xl font-bold tracking-[-0.03em]">
										{title as string}
									</h3>
									<p className="mt-3 leading-7 text-[#58706b]">
										{description as string}
									</p>
								</div>
							)
						})}
					</div>
				</section>

				<section className="px-5 pb-20 sm:px-8 lg:pb-28">
					<div className="mx-auto flex max-w-[1280px] flex-col items-start justify-between gap-8 rounded-[20px] bg-[#d6b353] px-7 py-10 sm:px-12 sm:py-14 lg:flex-row lg:items-end">
						<div className="max-w-2xl">
							<ShieldCheck className="h-8 w-8" />
							<h2 className="mt-8 font-[family-name:var(--font-heading)] text-4xl font-semibold leading-[0.98] tracking-[-0.05em] sm:text-5xl">
								Sua reserva continua sendo uma reserva.
							</h2>
							<p className="mt-5 text-lg leading-8 text-[#4b4225]">
								O limite diário considera o valor que você decidiu proteger
								antes de sugerir o que está disponível.
							</p>
						</div>
						<Link
							href={accountHref}
							className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#102d2c] px-6 py-3.5 font-semibold text-white transition-colors hover:bg-[#234744]"
						>
							Começar a planejar <ArrowRight className="h-4 w-4" />
						</Link>
					</div>
				</section>
			</main>

			<footer className="border-t border-[#102d2c]/10 px-5 py-10 sm:px-8">
				<div className="mx-auto flex max-w-[1280px] flex-col gap-5 text-sm text-[#58706b] sm:flex-row sm:items-center sm:justify-between">
					<div className="flex items-center gap-3">
						<Image src={LogoImage} alt="" className="h-7 w-7" />
						<span className="font-semibold text-[#234744]">vero</span>
						<span>Planejamento financeiro pessoal.</span>
					</div>
					<div className="flex flex-wrap gap-x-5 gap-y-2">
						<Link href="/termos-de-uso" className="hover:text-[#102d2c]">
							Termos de Uso
						</Link>
						<Link
							href="/politica-de-privacidade"
							className="hover:text-[#102d2c]"
						>
							Política de Privacidade
						</Link>
						<Link href="/auth/login" className="hover:text-[#102d2c]">
							Entrar
						</Link>
						<Link href="/auth/register" className="hover:text-[#102d2c]">
							Criar conta
						</Link>
					</div>
				</div>
			</footer>
		</div>
	)
}
