import Image from "next/image"
import Link from "next/link"
import type { ReactNode } from "react"

import LogoImage from "@/app/icon.png"

type LegalSection = {
	title: string
	content: ReactNode
}

type LegalPageLayoutProps = {
	title: string
	description: string
	sections: LegalSection[]
}

export function LegalPageLayout({
	title,
	description,
	sections,
}: LegalPageLayoutProps) {
	return (
		<div className="min-h-screen bg-[#f5f6f1] text-[#102d2c]">
			<header className="border-b border-[#102d2c]/10">
				<div className="mx-auto flex h-20 max-w-4xl items-center justify-between px-5 sm:px-8">
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
					<Link
						href="/auth/register"
						className="rounded-full bg-[#123c3a] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0b2928]"
					>
						Criar conta
					</Link>
				</div>
			</header>
			<main className="mx-auto max-w-4xl px-5 py-16 sm:px-8 sm:py-24">
				<p className="text-sm font-semibold text-[#16755d]">
					Última atualização: 18 de setembro de 2026
				</p>
				<h1 className="mt-5 font-[family-name:var(--font-heading)] text-5xl font-semibold leading-none tracking-[-0.055em] sm:text-6xl">
					{title}
				</h1>
				<p className="mt-7 max-w-2xl text-lg leading-8 text-[#47615d]">
					{description}
				</p>
				<div className="mt-16 space-y-12">
					{sections.map((section) => (
						<section key={section.title}>
							<h2 className="font-[family-name:var(--font-heading)] text-3xl font-semibold tracking-[-0.04em]">
								{section.title}
							</h2>
							<div className="mt-4 max-w-3xl space-y-4 leading-7 text-[#47615d]">
								{section.content}
							</div>
						</section>
					))}
				</div>
			</main>
			<footer className="border-t border-[#102d2c]/10 px-5 py-10 sm:px-8">
				<div className="mx-auto flex max-w-4xl flex-col gap-4 text-sm text-[#58706b] sm:flex-row sm:items-center sm:justify-between">
					<span>ILRocha, CNPJ 50.630.327/0001-15</span>
					<div className="flex gap-5">
						<Link href="/termos-de-uso" className="hover:text-[#102d2c]">
							Termos de Uso
						</Link>
						<Link
							href="/politica-de-privacidade"
							className="hover:text-[#102d2c]"
						>
							Política de Privacidade
						</Link>
					</div>
				</div>
			</footer>
		</div>
	)
}
