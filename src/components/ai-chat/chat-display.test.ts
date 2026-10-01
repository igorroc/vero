import { describe, it, expect } from "vitest"
import {
	deriveIntermediateSteps,
	deriveThoughtSteps,
	reasoningTextOf,
	splitMessageSteps,
} from "./thought-steps"
import { parseChartData } from "./markdown-text"

describe("deriveThoughtSteps", () => {
	it("converte tool calls em títulos com status (raciocínio à parte)", () => {
		const steps = deriveThoughtSteps([
			{ type: "reasoning", state: "done" },
			{ type: "tool-get_events", state: "output-available" },
			{ type: "tool-get_financial_summary", state: "input-streaming" },
		])
		expect(steps).toHaveLength(2)
		expect(steps[0]).toMatchObject({
			title: "Consultando lançamentos",
			status: "complete",
		})
		expect(steps[1]).toMatchObject({
			title: "Consultando resumo financeiro",
			status: "active",
		})
	})

	it("marca erro de tool e nome de dynamic-tool", () => {
		const steps = deriveThoughtSteps([
			{ type: "tool-get_events", state: "output-error" },
			{ type: "dynamic-tool", toolName: "get_categories" },
		])
		expect(steps[0]).toMatchObject({ status: "error" })
		expect(steps[1]).toMatchObject({
			title: "Consultando categorias",
			status: "active",
		})
	})

	it("ignora texto e data parts", () => {
		expect(
			deriveThoughtSteps([{ type: "text" }, { type: "data-x" }]),
		).toHaveLength(0)
	})
})

describe("reasoningTextOf", () => {
	it("concatena só as reasoning parts, ignorando texto", () => {
		expect(
			reasoningTextOf([
				{ type: "reasoning", text: "passo 1" },
				{ type: "text", text: "resposta" },
				{ type: "reasoning", text: "passo 2" },
			]),
		).toBe("passo 1\n\npasso 2")
	})

	it("devolve string vazia sem reasoning", () => {
		expect(reasoningTextOf([{ type: "text", text: "oi" }])).toBe("")
	})
})

describe("splitMessageSteps + deriveIntermediateSteps", () => {
	const parts = [
		{ type: "text" },
		{ type: "tool-get_events", state: "output-available" },
		{ type: "step-start" },
		{ type: "reasoning", state: "done" },
		{ type: "tool-get_financial_summary", state: "output-available" },
		{ type: "step-start" },
		{ type: "text" },
	]

	it("divide nos marcadores step-start", () => {
		const split = splitMessageSteps(parts)
		expect(split).toHaveLength(3)
		expect(split[0].map((p) => p.type)).toEqual(["text", "tool-get_events"])
	})

	it("intermediários viram títulos concluídos (texto vira 1 Pensando…)", () => {
		const titles = deriveIntermediateSteps(splitMessageSteps(parts))
		expect(titles.map((t) => t.title)).toEqual([
			"Pensando…",
			"Consultando lançamentos",
			"Pensando…",
			"Consultando resumo financeiro",
		])
		expect(titles.every((t) => t.status === "complete")).toBe(true)
	})

	it("mensagem sem steps: nada intermediário", () => {
		expect(
			deriveIntermediateSteps(splitMessageSteps([{ type: "text" }])),
		).toHaveLength(0)
	})
})

describe("parseChartData", () => {
	it("aceita gráfico de barras válido", () => {
		const chart = parseChartData(
			'{"type": "bar", "title": "Gastos", "unit": "R$", "data": [{"label": "Maio", "value": 280}]}',
		)
		expect(chart?.data).toHaveLength(1)
		expect(chart?.title).toBe("Gastos")
	})

	it("rejeita formato inválido", () => {
		expect(parseChartData("não é json")).toBeNull()
		expect(parseChartData('{"type": "pie", "data": []}')).toBeNull()
		expect(parseChartData('{"type": "bar", "data": []}')).toBeNull()
		expect(
			parseChartData('{"type": "bar", "data": [{"label": "X"}]}'),
		).toBeNull()
	})
})
