export const eventIconKeys = [
	"property",
	"beauty",
	"income",
	"adjustment",
	"bill",
	"phone",
	"education",
	"donation",
	"transport",
	"housing",
	"shopping",
	"food",
	"health",
	"utilities",
	"other",
] as const

export type EventIconKey = (typeof eventIconKeys)[number]

interface EventIconRule {
	iconKey: EventIconKey
	keywords: string[]
}

export const eventIconDefinitions: Record<
	EventIconKey,
	{ label: string; color: string }
> = {
	property: { label: "Imóvel", color: "#6366f1" },
	beauty: { label: "Beleza", color: "#ec4899" },
	income: { label: "Receitas", color: "#10b981" },
	adjustment: { label: "Ajustes", color: "#14b8a6" },
	bill: { label: "Faturas", color: "#f97316" },
	phone: { label: "Telefone", color: "#0ea5e9" },
	education: { label: "Educação", color: "#8b5cf6" },
	donation: { label: "Doações", color: "#f43f5e" },
	transport: { label: "Transporte", color: "#eab308" },
	housing: { label: "Moradia", color: "#78716c" },
	shopping: { label: "Compras", color: "#3b82f6" },
	food: { label: "Alimentação", color: "#22c55e" },
	health: { label: "Saúde", color: "#ef4444" },
	utilities: { label: "Serviços", color: "#06b6d4" },
	other: { label: "Outros gastos", color: "#94a3b8" },
}

const eventIconRules: EventIconRule[] = [
	{
		iconKey: "property",
		keywords: ["ssn", "evolucao de obra", "financiamento"],
	},
	{ iconKey: "beauty", keywords: ["unha", "depilacao"] },
	{ iconKey: "income", keywords: ["salario", "renda"] },
	{ iconKey: "adjustment", keywords: ["correcao monetaria"] },
	{ iconKey: "bill", keywords: ["fatura", "pagamento", "divida", "imposto"] },
	{ iconKey: "phone", keywords: ["telefone"] },
	{ iconKey: "education", keywords: ["curso", "bateria"] },
	{ iconKey: "donation", keywords: ["dizimo"] },
	{
		iconKey: "transport",
		keywords: ["transporte", "uber", "99", "carro", "gasolina"],
	},
	{ iconKey: "housing", keywords: ["aluguel", "casa", "moradia"] },
	{
		iconKey: "shopping",
		keywords: ["mercado", "compra", "shopping", "acougue"],
	},
	{
		iconKey: "food",
		keywords: ["restaurante", "comida", "alimenta", "salgado"],
	},
	{ iconKey: "health", keywords: ["saude", "medico", "farmacia"] },
	{ iconKey: "utilities", keywords: ["energia", "luz", "agua", "internet"] },
]

export function getEventIconKey(description: string): EventIconKey {
	const normalizedDescription = description
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
	const matchingRule = eventIconRules.find((rule) =>
		rule.keywords.some((keyword) => normalizedDescription.includes(keyword)),
	)

	return matchingRule?.iconKey ?? "other"
}
