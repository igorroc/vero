/**
 * Conversas anteriores MOCKADAS (só visual, sem persistência).
 *
 * Quando o usuário abre uma delas, um chat NOVO é iniciado do zero
 * (o `useChat` é remontado) e essas mensagens aparecem no topo apenas como
 * exemplo ilustrativo, com divisão visual clara das mensagens reais.
 * Quando o schema de chats/mensagens existir, este módulo sai de cena.
 */

export type MockConversationGroup = "Hoje" | "Ontem" | "Esta semana"

export const MOCK_GROUP_ORDER: MockConversationGroup[] = [
	"Hoje",
	"Ontem",
	"Esta semana",
]

export interface MockLeadMessage {
	role: "user" | "assistant"
	text: string
}

export interface MockConversation {
	id: string
	title: string
	preview: string
	/** Agrupamento da lista ("Hoje", "Ontem", "Esta semana"). */
	group: MockConversationGroup
	/** Rótulo de horário exibido à direita ("10:24", "Ontem", "27/09"). */
	timeLabel: string
	leadMessages: MockLeadMessage[]
}

export const MOCK_CONVERSATIONS: MockConversation[] = [
	{
		id: "mock-evolucao-gasolina",
		title: "Evolução de gastos com gasolina",
		preview: "Qual foi a minha evolução de gastos de...",
		group: "Hoje",
		timeLabel: "10:24",
		leadMessages: [
			{
				role: "user",
				text: "Qual foi a minha evolução de gastos com gasolina?",
			},
			{
				role: "assistant",
				text: "Seus gastos com gasolina subiram de **R$ 180,00** para **R$ 240,00** nas últimas 4 semanas. Vale conferir os lançamentos de transporte na tela de lançamentos.",
			},
		],
	},
	{
		id: "mock-gastar-hoje",
		title: "Posso gastar R$ 120 hoje?",
		preview: "Considerando meu orçamento, posso...",
		group: "Hoje",
		timeLabel: "09:15",
		leadMessages: [
			{
				role: "user",
				text: "Considerando meu orçamento, posso gastar R$ 120 hoje?",
			},
			{
				role: "assistant",
				text: "Sim — os R$ 120,00 cabem no seu **limite diário**. Só evite novos gastos hoje para não estourar a meta da semana.",
			},
		],
	},
	{
		id: "mock-melhorar-caixa",
		title: "Como melhorar meu caixa este mês",
		preview: "Quais são as melhores ações para...",
		group: "Ontem",
		timeLabel: "Ontem",
		leadMessages: [
			{
				role: "user",
				text: "Quais são as melhores ações para melhorar meu caixa este mês?",
			},
			{
				role: "assistant",
				text: "Três ações: adie os gastos opcionais, antecipe uma receita em aberto e resgate apenas o necessário dos investimentos. Quer que eu liste seus gastos opcionais?",
			},
		],
	},
	{
		id: "mock-alimentacao-transporte",
		title: "Comparar alimentação e transporte",
		preview: "Qual categoria tem maior impacto no meu...",
		group: "Ontem",
		timeLabel: "Ontem",
		leadMessages: [
			{
				role: "user",
				text: "Qual categoria tem maior impacto no meu orçamento: alimentação ou transporte?",
			},
			{
				role: "assistant",
				text: "Alimentação representa a maior fatia, com cerca de **35%** dos gastos do mês, contra 20% de transporte.",
			},
		],
	},
	{
		id: "mock-compra-notebook",
		title: "Simulação de compra de notebook",
		preview: "Quero simular a compra de um notebook...",
		group: "Esta semana",
		timeLabel: "27/09",
		leadMessages: [
			{
				role: "user",
				text: "Quero simular a compra de um notebook de R$ 3.500. Cabe no meu mês?",
			},
			{
				role: "assistant",
				text: "À vista não cabe: sua conta fecha o mês negativa. Parcelado em 10x de R$ 350,00, cabe se você adiar os gastos opcionais. Quer ver a simulação?",
			},
		],
	},
	{
		id: "mock-planejamento-viagem",
		title: "Planejamento de viagem",
		preview: "Quanto preciso guardar para uma viagem...",
		group: "Esta semana",
		timeLabel: "25/09",
		leadMessages: [
			{
				role: "user",
				text: "Quanto preciso guardar para uma viagem em dezembro?",
			},
			{
				role: "assistant",
				text: "Para uma meta de R$ 5.000,00 até dezembro, guarde cerca de **R$ 1.650,00 por mês**. Posso montar esse plano com você?",
			},
		],
	},
]
