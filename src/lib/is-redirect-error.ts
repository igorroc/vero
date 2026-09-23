/**
 * Detecta o erro de redirect (`redirect()` em Server Action) no cliente.
 *
 * O Next.js sinaliza o redirect com um erro cujo `digest` começa com
 * "NEXT_REDIRECT". Esse erro precisa voltar a ser lançado para que o
 * roteador execute a navegação — engoli-lo quebra o login/cadastro.
 */
export function isRedirectError(error: unknown): boolean {
	if (!(error instanceof Error)) return false
	const digest = (error as { digest?: unknown }).digest
	return typeof digest === "string" && digest.startsWith("NEXT_REDIRECT")
}
