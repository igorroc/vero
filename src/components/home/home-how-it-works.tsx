import { CheckCircle2 } from "lucide-react"

const steps = [
	{ title: "Cadastre suas contas", description: "Adicione suas contas bancárias, dinheiro em espécie e contas de investimento com o saldo atual." },
	{ title: "Adicione eventos futuros", description: "Cadastre suas receitas e despesas conhecidas: salário, aluguel, contas fixas, etc." },
	{ title: "Veja o futuro", description: "O dashboard mostra sua projeção financeira, limite diário e alertas importantes." },
	{ title: "Confirme quando acontecer", description: "Quando um evento realmente acontecer, confirme para atualizar seu saldo real." },
]

function Step({ title, description, number, isLast }: (typeof steps)[number] & { number: number; isLast: boolean }) {
	return (
		<div className={isLast ? undefined : "relative"}>
			<div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl mb-4">{number}</div>
			<h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">{title}</h3>
			<p className="text-slate-600 dark:text-slate-400">{description}</p>
			{!isLast && <div className="hidden md:block absolute top-6 left-full w-full h-0.5 bg-gradient-to-r from-blue-500 to-transparent" />}
		</div>
	)
}

export function HomeHowItWorks() {
	return (
		<section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900">
			<div className="max-w-7xl mx-auto">
				<div className="text-center max-w-3xl mx-auto mb-16">
					<div className="inline-flex items-center gap-2 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-4 py-2 rounded-full text-sm font-medium mb-4">
						<CheckCircle2 className="w-4 h-4" />
						Simples de Usar
					</div>
					<h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">Como o Vero funciona</h2>
					<p className="text-lg text-slate-600 dark:text-slate-400">Em poucos minutos você já terá uma visão clara do seu futuro financeiro.</p>
				</div>
				<div className="grid md:grid-cols-4 gap-8">
					{steps.map((step, index) => <Step key={step.title} {...step} number={index + 1} isLast={index === steps.length - 1} />)}
				</div>
			</div>
		</section>
	)
}
