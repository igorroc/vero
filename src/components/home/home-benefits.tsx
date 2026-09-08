import { CheckCircle2, Target } from "lucide-react"

const benefits = [
	{ title: "Tome decisões com confiança", description: "Saber quanto pode gastar por dia elimina a ansiedade financeira." },
	{ title: "Evite emergências financeiras", description: "Identifique problemas com semanas de antecedência e tenha tempo para agir." },
	{ title: "Construa patrimônio de forma intencional", description: "Planeje investimentos recorrentes e veja seu patrimônio crescer." },
	{ title: "Simples e direto ao ponto", description: "Sem categorização manual de cada gasto. Foco no que importa: o futuro." },
]

const questions = [
	"\"Quanto posso gastar hoje sem comprometer meu futuro?\"",
	"\"O que vai acontecer com meu dinheiro nos próximos 90 dias?\"",
	"\"Estou no caminho certo para crescer meu patrimônio?\"",
]

function Benefit({ title, description }: (typeof benefits)[number]) {
	return (
		<div className="flex gap-4">
			<div className="flex-shrink-0 w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
				<CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
			</div>
			<div>
				<h3 className="font-semibold text-slate-900 dark:text-white mb-1">{title}</h3>
				<p className="text-slate-600 dark:text-slate-400">{description}</p>
			</div>
		</div>
	)
}

export function HomeBenefits() {
	return (
		<section id="benefits" className="py-20 px-4 sm:px-6 lg:px-8">
			<div className="max-w-7xl mx-auto">
				<div className="grid lg:grid-cols-2 gap-16 items-center">
					<div>
						<div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-full text-sm font-medium mb-4">
							<Target className="w-4 h-4" />
							Benefícios
						</div>
						<h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-6">Por que usar o Vero?</h2>
						<div className="space-y-6">
							{benefits.map((benefit) => <Benefit key={benefit.title} {...benefit} />)}
						</div>
					</div>
					<div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl p-8 text-white">
						<h3 className="text-2xl font-bold mb-6">A pergunta que o Vero responde:</h3>
						<div className="space-y-4">
							{questions.map((question) => (
								<div key={question} className="bg-white/10 rounded-xl p-4">
									<p className="text-lg font-medium">{question}</p>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		</section>
	)
}
