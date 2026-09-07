const { PrismaClient } = require("@prisma/client")

const prisma = new PrismaClient()

const categoryGroups = [
	{ id: "fixed-income", name: "Renda fixa", type: "INCOME" },
	{ id: "variable-income", name: "Renda variável", type: "INCOME" },
	{ id: "housing", name: "Moradia", type: "ESSENTIAL" },
	{ id: "food", name: "Alimentação", type: "ESSENTIAL" },
	{ id: "transportation", name: "Transporte", type: "ESSENTIAL" },
	{ id: "health", name: "Saúde", type: "ESSENTIAL" },
	{ id: "debts", name: "Dívidas", type: "ESSENTIAL" },
	{ id: "personal-care", name: "Cuidados pessoais", type: "LIFESTYLE" },
	{ id: "leisure", name: "Lazer", type: "LIFESTYLE" },
	{ id: "education", name: "Educação", type: "LIFESTYLE" },
	{ id: "personal-purchases", name: "Aquisições pessoais", type: "LIFESTYLE" },
	{ id: "subscriptions", name: "Assinaturas", type: "LIFESTYLE" },
	{ id: "pet", name: "Pet", type: "LIFESTYLE" },
	{ id: "other", name: "Outros", type: "LIFESTYLE" },
	{ id: "financial-goals", name: "Metas financeiras", type: "INVESTMENT" },
]

async function main() {
	for (const group of categoryGroups) {
		await prisma.categoryGroup.upsert({
			where: { name: group.name },
			update: {},
			create: group,
		})
	}

	console.log("Grupos de categorias verificados com sucesso.")
}

main()
	.catch((error) => {
		console.error("Falha ao preencher os grupos de categorias:", error)
		process.exitCode = 1
	})
	.finally(async () => {
		await prisma.$disconnect()
	})
