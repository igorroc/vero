import { describe, it, expect } from "vitest"
import { assertPathInsideCwd } from "./paths"

describe("assertPathInsideCwd", () => {
	it("aceita caminho dentro da pasta atual", () => {
		expect(() => assertPathInsideCwd("docs/ai-conciliacao")).not.toThrow()
	})

	it("rejeita fuga com ..", () => {
		expect(() => assertPathInsideCwd("../fora-do-projeto")).toThrow(
			"Caminho fora da pasta do projeto",
		)
	})

	it("rejeita caminho absoluto fora do projeto", () => {
		expect(() => assertPathInsideCwd("/tmp/fora")).toThrow(
			"Caminho fora da pasta do projeto",
		)
	})
})
