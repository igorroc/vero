/**
 * Remove blocos de raciocínio (`<think>…</think>`) que alguns modelos vazam no
 * canal de texto. Mantém o restante intacto.
 */
export function stripThinkingBlocks(text: string): string {
	return text
		.replace(/<think>[\s\S]*?(<\/think>|$)/gi, "")
		.replace(/<thinking>[\s\S]*?(<\/thinking>|$)/gi, "")
		.trim()
}

const EN_STOPWORDS = new Set(
	"the and is are was were be been to of a an in for on with let me this that these those you your yours will can could should would have has had not no from what which how why they them their there here also about based shows means think thinks actually however focus matters enough info check very low high seems might more most other some such than then only just like get does did but don re".split(
		" ",
	),
)

const PT_STOPWORDS = new Set(
	"você seu sua seus suas para com uma um por não dos das nos nas que este esta isso como mais mas sobre entre até foi são tem aqui veja sim hoje mês meses saldo saldos gastos gasto limite diário valor valores reais projeção resumo pode quer agora ainda muito boa notícia conclusão próximos próxima seguinte tabela detalhes fique atento além disso segundo pois porque onde qual quais quando quanto partir".split(
		" ",
	),
)

function scoreParagraph(paragraph: string): { en: number; pt: number } {
	const words = paragraph.toLowerCase().split(/[^a-zà-ú]+/i)
	let en = 0
	let pt = 0
	for (const word of words) {
		if (!word) continue
		if (EN_STOPWORDS.has(word)) en += 1
		if (PT_STOPWORDS.has(word)) pt += 1
	}
	return { en, pt }
}

function isPortuguese(paragraph: string): boolean {
	const { en, pt } = scoreParagraph(paragraph)
	return pt >= en
}

/**
 * Mantém só linhas em português. Modelos gratuitos vazam chain-of-thought em
 * inglês no canal de texto (inclusive colado com `\n` simples no conteúdo PT);
 * esse filtro determinístico remove linha a linha. Blocos cercados
 * (código/gráficos) são sempre preservados. Quebras simples não alteram o
 * markdown (soft break), então tabelas e listas sobrevivem intactas.
 */
export function filterPortugueseParagraphs(text: string): string {
	const segments = text.split(/(```[\s\S]*?(?:```|$))/g)
	const kept = segments.map((segment) => {
		if (segment.startsWith("```")) return segment
		return segment
			.split("\n")
			.filter((line) => line.trim() === "" || isPortuguese(line))
			.join("\n")
	})
	return kept
		.join("")
		.replace(/\n{3,}/g, "\n\n")
		.trim()
}
