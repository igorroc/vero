import { AsyncLocalStorage } from "node:async_hooks"
import type { User } from "@prisma/client"

/**
 * Contexto de requisição para transportes sem cookie (MCP, webhooks). Permite
 * que `getUserBySession()` resolva o usuário autenticado por Bearer token sem
 * que as actions existentes precisem receber `userId` por parâmetro.
 */
const storage = new AsyncLocalStorage<User>()

/** Executa `fn` com o usuário atual disponível para toda a cadeia assíncrona. */
export function runWithUser<T>(user: User, fn: () => T): T {
	return storage.run(user, fn)
}

/** Usuário injetado no contexto atual, ou `null` fora de um `runWithUser`. */
export function getRequestUser(): User | null {
	return storage.getStore() ?? null
}
