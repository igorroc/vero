import { describe, it, expect } from "vitest"
import type { User } from "@prisma/client"

import { getRequestUser, runWithUser } from "./request-context"

const user = { id: "u1" } as User

describe("request-context", () => {
	it("fora de um runWithUser não há usuário", () => {
		expect(getRequestUser()).toBeNull()
	})

	it("injeta o usuário ao longo da cadeia assíncrona", async () => {
		const result = await runWithUser(user, async () => {
			await Promise.resolve()
			return getRequestUser()
		})
		expect(result).toEqual(user)
	})

	it("não vaza o usuário para fora do escopo", () => {
		runWithUser(user, () => {
			expect(getRequestUser()).toEqual(user)
		})
		expect(getRequestUser()).toBeNull()
	})
})
