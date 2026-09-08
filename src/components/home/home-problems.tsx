import { CreditCard, Target, TrendingUp, type LucideIcon } from "lucide-react"

const problems: { icon: LucideIcon; iconClassName: string; iconBackgroundClassName: string; title: string; description: string }[] = [
	{ icon: CreditCard, iconClassName: "text-red-600 dark:text-red-400", iconBackgroundClassName: "bg-red-100 dark:bg-red-900/30", title: "Sem surpresas no fim do mês", description: "Visualize todas as contas e receitas antes que elas aconteçam. Nunca mais seja pego de surpresa." },
	{ icon: Target, iconClassName: "text-amber-600 dark:text-amber-400", iconBackgroundClassName: "bg-amber-100 dark:bg-amber-900/30", title: "Limite diário inteligente", description: "Saiba exatamente quanto pode gastar por dia considerando suas contas futuras e reserva de segurança." },
	{ icon: TrendingUp, iconClassName: "text-green-600 dark:text-green-400", iconBackgroundClassName: "bg-green-100 dark:bg-green-900/30", title: "Cresça seu patrimônio", description: "Planeje investimentos recorrentes e acompanhe sua jornada rumo às suas metas financeiras." },
]

function ProblemCard({ icon: Icon, iconClassName, iconBackgroundClassName, title, description }: (typeof problems)[number]) {
	return (
		<div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm">
			<div className={`w-12 h-12 ${iconBackgroundClassName} rounded-xl flex items-center justify-center mb-4`}>
				<Icon className={`w-6 h-6 ${iconClassName}`} />
			</div>
			<h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">{title}</h3>
			<p className="text-slate-600 dark:text-slate-400">{description}</p>
		</div>
	)
}

export function HomeProblems() {
	return (
		<section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900">
			<div className="max-w-7xl mx-auto">
				<div className="text-center max-w-3xl mx-auto mb-16">
					<h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">Você sabe quanto pode gastar hoje?</h2>
					<p className="text-lg text-slate-600 dark:text-slate-400">A maioria das pessoas controla gastos olhando para o passado. O Vero inverte essa lógica: te mostra o futuro para você decidir melhor no presente.</p>
				</div>
				<div className="grid md:grid-cols-3 gap-8">
					{problems.map((problem) => <ProblemCard key={problem.title} {...problem} />)}
				</div>
			</div>
		</section>
	)
}
