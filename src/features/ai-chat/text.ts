/**
 * Sanitização determinística da resposta do assistente.
 *
 * Modelos baratos vazam chain-of-thought no canal de texto, em inglês, com
 * valores brutos em centavos, antes da resposta final em português. Ex.:
 *
 * ```
 * Projection 30d: starting 249665 (R$ 2.496,65), ...
 * Safety buffer: R$ 100,00
 * Key observations:
 * ...
 * The answer: Sim, você tem saldo...
 * ```
 *
 * `sanitizeAssistantReply` remove esse rascunho e devolve SÓ o texto final em
 * português. É seguro para streaming parcial (só corta após marcador
 * completo com ":") e preserva blocos cercados (```chart, código) e markdown.
 */
export function stripThinkingBlocks(text: string): string {
	return text
		.replace(/<think>[\s\S]*?(<\/think>|$)/gi, "")
		.replace(/<thinking>[\s\S]*?(<\/thinking>|$)/gi, "")
		.trim()
}

// Marcador explícito de resposta final. Quando o modelo escreve o rascunho e
// depois "The answer: ...", tudo antes do ÚLTIMO marcador é descartado.
const FINAL_ANSWER_MARKER =
	/(?:^|\n)[ \t>]*((?:the|final)\s+answer|answer|resposta\s+final)\s*:[ \t]*/gi

// Rótulos em inglês típicos do rascunho ("Safety buffer: ...",
// "Current confirmed balance: ..."). Qualquer linha "Rótulo: valor" cujo
// rótulo contenha uma dessas palavras é rascunho, mesmo que tenha "R$".
// ATENÇÃO: só palavras que NÃO existem em português ("total" é PT e EN,
// então fica fora — "Saldo total atual: ..." é resposta legítima).
const EN_SCRATCH_LABELS = new Set(
	"projection projected starting ending net change safety buffer key observations observation current confirmed balance next event events daily limit spending summary analysis based note notes overall answer critical upcoming".split(
		" ",
	),
)

// Linhas que começam com esses verbos/frases em inglês são rascunho.
const EN_LEAD_PATTERN =
	/^\s*(projection|projected|starting|ending|net change|safety buffer|key observations?|current\b|next event|total balance|daily limit|spending limit|critical events?|upcoming events?|based on|let me|i'll\b|i will\b|i need\b|looking at|first,|overall,|in summary|here is|here are|this (shows|means|seems)|total:|summary:)\b/i

function hasRawCents(line: string): boolean {
	// Inteiro "solto" com 5+ dígitos fora de formatação PT (ex. 249665,
	// 883277, 70277) = valor bruto em centavos vazado. Anos (2026) têm 4
	// dígitos; valores PT usam ponto/vírgula (2.496,65), nunca 5+ dígitos
	// colados. Datas ISO e code fences são tratados fora daqui.
	if (/\b\d{5,}\b/.test(line)) return true
	if (/\(\s*\d[\d.,]*\s*(cents?|centavos)\s*\)/i.test(line)) return true
	return /\b\d+\s*cents?\b/i.test(line)
}

function hasEnglishScratchLabel(line: string): boolean {
	const colon = line.indexOf(":")
	if (colon <= 0 || colon > 60) return false
	// Não confundir com tabelas/listas/citações.
	const trimmed = line.trimStart()
	if (
		trimmed.startsWith("|") ||
		trimmed.startsWith("#") ||
		trimmed.startsWith(">") ||
		trimmed.startsWith("-") ||
		trimmed.startsWith("*") ||
		/^\d+[.)]\s/.test(trimmed)
	) {
		return false
	}
	const label = line
		.slice(0, colon)
		.toLowerCase()
		.split(/[^a-z]+/)
	return label.some((word) => EN_SCRATCH_LABELS.has(word))
}

function isScratchLine(line: string): boolean {
	const trimmed = line.trim()
	if (trimmed === "") return false
	if (EN_LEAD_PATTERN.test(line)) return true
	if (hasEnglishScratchLabel(line)) return true
	return hasRawCents(line)
}

const EN_STOPWORDS = new Set(
	"the and is are was were be been to of a an in for on with let me this that these those you your yours will can could should would have has had not no from what which how why they them their there here also about based shows means think thinks actually however focus matters enough info check very low high seems might more most other some such than then only just like get does did but don re".split(
		" ",
	),
)

const PT_STOPWORDS = new Set(
	"você seu sua seus suas para com uma um por não dos das nos nas que este esta isso como mais mas sobre entre até foi são tem aqui veja sim hoje mês meses saldo saldos gastos gasto limite diário valor valores reais projeção resumo pode quer agora ainda muito boa notícia conclusão próximos próxima seguinte tabela detalhes fique atento além disso segundo pois porque onde qual quais quando quanto partir terá tenho".split(
		" ",
	),
)

function scoreLine(line: string): { en: number; pt: number } {
	const words = line.toLowerCase().split(/[^a-zà-ú]+/i)
	let en = 0
	let pt = 0
	for (const word of words) {
		if (!word) continue
		if (EN_STOPWORDS.has(word)) en += 1
		if (PT_STOPWORDS.has(word)) pt += 1
	}
	return { en, pt }
}

function hasPortugueseSignal(line: string): boolean {
	if (/[ãõçéêíóúâôàüÃÕÇÉÊÍÓÚÂÔÀÜ]/.test(line)) return true
	const { pt } = scoreLine(line)
	if (pt > 0) return true
	// Estrutura markdown legítima com conteúdo numérico PT.
	const trimmed = line.trimStart()
	return (
		trimmed.startsWith("|") ||
		trimmed.startsWith("#") ||
		trimmed.startsWith(">") ||
		/^\d+[.)]\s/.test(trimmed) ||
		/^[-*+]\s/.test(trimmed)
	)
}

function isEnglishOnly(line: string): boolean {
	const { en, pt } = scoreLine(line)
	if (pt > 0) return false
	if (hasPortugueseSignal(line)) return false
	// Sem stopwords nos dois idiomas (ex. "Safety buffer: R$ 100,00" ou
	// "Projection 30d: ..."): decide pelo vocabulário técnico em inglês.
	if (en === 0) {
		return /[a-zA-Z]/.test(line) && !/R\$/.test(line)
			? EN_LEAD_PATTERN.test(line) || hasEnglishScratchLabel(line)
			: false
	}
	return en > 0
}

function cutBeforeFinalAnswer(text: string): string {
	FINAL_ANSWER_MARKER.lastIndex = 0
	let lastEnd = -1
	let match: RegExpExecArray | null
	while ((match = FINAL_ANSWER_MARKER.exec(text)) !== null) {
		lastEnd = match.index + match[0].length
		// Evita loop infinito em regex global com match vazio.
		if (match[0].length === 0) FINAL_ANSWER_MARKER.lastIndex += 1
	}
	if (lastEnd < 0) return text
	return text.slice(lastEnd)
}

function sanitizeSegment(segment: string): string {
	const lines = segment.split("\n")
	const kept: string[] = []
	for (const line of lines) {
		if (line.trim() === "") {
			kept.push(line)
			continue
		}
		if (isScratchLine(line)) continue
		if (isEnglishOnly(line)) continue
		kept.push(line)
	}
	return kept.join("\n")
}

function dedupeParagraphs(text: string): string {
	const paragraphs = text.split(/\n\s*\n/)
	const seen = new Set<string>()
	const out: string[] = []
	for (const paragraph of paragraphs) {
		const normalized = paragraph
			.toLowerCase()
			.replace(/[\s\p{P}]+/gu, " ")
			.trim()
		if (normalized === "") continue
		if (seen.has(normalized)) continue
		seen.add(normalized)
		out.push(paragraph.trim())
	}
	return out.join("\n\n")
}

/**
 * Devolve só a resposta final em português, sem rascunho em inglês, sem
 * valores brutos em centavos e sem prefixos como "The answer:".
 */
export function sanitizeAssistantReply(text: string): string {
	const withoutThinking = stripThinkingBlocks(text)
	if (!withoutThinking) return ""
	const finalOnly = cutBeforeFinalAnswer(withoutThinking)
	const segments = finalOnly.split(/(```[\s\S]*?(?:```|$))/g)
	const cleaned = segments
		.map((segment) =>
			segment.startsWith("```") ? segment : sanitizeSegment(segment),
		)
		.join("")
		.replace(/\n{3,}/g, "\n\n")
		.trim()
	if (!cleaned) return ""
	return dedupeParagraphs(cleaned)
}

/**
 * @deprecated Prefira `sanitizeAssistantReply`, que além do idioma remove
 * rascunho em inglês, centavos brutos e prefixos como "The answer:".
 */
export function filterPortugueseParagraphs(text: string): string {
	return sanitizeAssistantReply(text)
}
