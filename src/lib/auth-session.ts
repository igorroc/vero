/**
 * Regras puras de duração da sessão ("Lembrar de mim").
 *
 * Sem "use server": apenas constantes e funções puras, para que possam
 * ser importadas por Server Actions e cobertas por testes unitários.
 */

export const SESSION_COOKIE_NAME = "session"

/** Sessão curta (sem "Lembrar de mim"): 24 horas, em segundos. */
export const STANDARD_SESSION_MAX_AGE_SECONDS = 24 * 60 * 60

/** Sessão persistente (com "Lembrar de mim"): 30 dias, em segundos. */
export const REMEMBERED_SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60

export type SessionDuration = {
	/** Tempo de vida do cookie e do JWT, em segundos. */
	maxAge: number
	/** Se a sessão foi criada com "Lembrar de mim". */
	rememberMe: boolean
}

/**
 * Resolve a duração da sessão a partir da escolha do usuário no login.
 */
export function resolveSessionDuration(rememberMe: boolean): SessionDuration {
	return {
		maxAge: rememberMe
			? REMEMBERED_SESSION_MAX_AGE_SECONDS
			: STANDARD_SESSION_MAX_AGE_SECONDS,
		rememberMe,
	}
}

/**
 * Interpreta o valor do checkbox "rememberMe" vindo de um FormData.
 * Checkbox marcado envia "true" (input controlado) ou "on" (nativo).
 */
export function parseRememberMe(
	value: FormDataEntryValue | null | undefined,
): boolean {
	return value === "true" || value === "on"
}
