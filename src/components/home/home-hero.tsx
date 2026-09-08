"use client"

import { Button } from "@nextui-org/react"
import { ArrowRight, Sparkles } from "lucide-react"
import Link from "next/link"

const stats = [
	{ value: "90", label: "dias de projeção" },
	{ value: "100%", label: "gratuito" },
	{ value: "24/7", label: "disponível" },
	{ value: "0", label: "anúncios" },
]

export function HomeHero() {
	return (
		<section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
			<div className="max-w-7xl mx-auto">
				<div className="text-center max-w-4xl mx-auto">
					<div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-full text-sm font-medium mb-6">
						<Sparkles className="w-4 h-4" />
						Seu copiloto financeiro pessoal
					</div>
					<h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-white leading-tight mb-6">
						Pare de se perguntar.
						<br />
						<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
							Comece a planejar.
						</span>
					</h1>
					<p className="text-xl text-slate-600 dark:text-slate-400 mb-10 max-w-2xl mx-auto">
						O Vero te ajuda a entender o que vai acontecer com seu dinheiro, quanto você pode gastar por dia e como crescer seu patrimônio de forma intencional.
					</p>
					<div className="flex flex-col sm:flex-row items-center justify-center gap-4">
						<Button as={Link} href="/auth/register" color="primary" size="lg" className="font-semibold px-8" endContent={<ArrowRight className="w-5 h-5" />}>
							Comece Gratuitamente
						</Button>
						<Button as={Link} href="#how-it-works" variant="bordered" size="lg" className="font-semibold px-8">
							Veja Como Funciona
						</Button>
					</div>
				</div>
				<div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
					{stats.map((stat) => (
						<div key={stat.label} className="text-center">
							<div className="text-3xl font-bold text-slate-900 dark:text-white">{stat.value}</div>
							<div className="text-slate-600 dark:text-slate-400">{stat.label}</div>
						</div>
					))}
				</div>
			</div>
		</section>
	)
}
