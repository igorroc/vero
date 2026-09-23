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
