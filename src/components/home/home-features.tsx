import { BarChart3, Calendar, LineChart, PiggyBank, Shield, Wallet, Zap, type LucideIcon } from "lucide-react"

const features: { icon: LucideIcon; cardClassName: string; iconClassName: string; title: string; description: string }[] = [
	{ icon: BarChart3, cardClassName: "hover:border-blue-500 dark:hover:border-blue-500", iconClassName: "from-blue-500 to-blue-600", title: "Dashboard Inteligente", description: "Visão completa da sua saúde financeira em tempo real. Saldo total, limite diário, projeções e alertas importantes." },
	{ icon: LineChart, cardClassName: "hover:border-purple-500 dark:hover:border-purple-500", iconClassName: "from-purple-500 to-purple-600", title: "Fluxo de Caixa", description: "Projeção dia a dia para os próximos 30, 60 ou 90 dias. Identifique dias críticos antes que eles aconteçam." },
	{ icon: Wallet, cardClassName: "hover:border-green-500 dark:hover:border-green-500", iconClassName: "from-green-500 to-green-600", title: "Limite de Gastos", description: "Descubra quanto pode gastar por dia com segurança, considerando despesas futuras e sua reserva de emergência." },
	{ icon: Calendar, cardClassName: "hover:border-amber-500 dark:hover:border-amber-500", iconClassName: "from-amber-500 to-amber-600", title: "Eventos Recorrentes", description: "Configure receitas e despesas que se repetem automaticamente. Diário, semanal, quinzenal, mensal ou anual." },
	{ icon: PiggyBank, cardClassName: "hover:border-cyan-500 dark:hover:border-cyan-500", iconClassName: "from-cyan-500 to-cyan-600", title: "Planos de Investimento", description: "Automatize seus aportes mensais e acompanhe o progresso rumo às suas metas de patrimônio." },
	{ icon: Shield, cardClassName: "hover:border-rose-500 dark:hover:border-rose-500", iconClassName: "from-rose-500 to-rose-600", title: "Reserva de Segurança", description: "Defina um valor mínimo que você quer manter em conta. O sistema nunca vai sugerir gastar sua reserva." },
]

function FeatureCard({ icon: Icon, cardClassName, iconClassName, title, description }: (typeof features)[number]) {
	return (
		<div className={`group p-6 rounded-2xl border border-slate-200 dark:border-slate-800 ${cardClassName} transition-all hover:shadow-lg`}>
			<div className={`w-12 h-12 bg-gradient-to-br ${iconClassName} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
				<Icon className="w-6 h-6 text-white" />
			</div>
			<h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">{title}</h3>
			<p className="text-slate-600 dark:text-slate-400">{description}</p>
		</div>
	)
}

export function HomeFeatures() {
	return (
		<section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
			<div className="max-w-7xl mx-auto">
				<div className="text-center max-w-3xl mx-auto mb-16">
					<div className="inline-flex items-center gap-2 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-4 py-2 rounded-full text-sm font-medium mb-4">
						<Zap className="w-4 h-4" />
						Funcionalidades
					</div>
					<h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
						Tudo que você precisa para
						<br />
						<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">controlar suas finanças</span>
					</h2>
					<p className="text-lg text-slate-600 dark:text-slate-400">Ferramentas poderosas e simples de usar para você tomar as melhores decisões financeiras.</p>
				</div>
				<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
					{features.map((feature) => <FeatureCard key={feature.title} {...feature} />)}
				</div>
			</div>
		</section>
	)
}
