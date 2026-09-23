import { describe, it, expect } from "vitest"
import {
	deriveIntermediateSteps,
	deriveThoughtSteps,
	splitMessageSteps,
} from "./thought-steps"
import { parseChartData } from "./markdown-text"

describe("deriveThoughtSteps", () => {
	it("converte tool calls em títulos com estado", () => {
		const steps = deriveThoughtSteps([
			{ type: "reasoning", state: "done" },
			{ type: "tool-get_events", state: "output-available" },
			{ type: "tool-get_financial_summary", state: "input-streaming" },
		])
		expect(steps).toHaveLength(3)
		expect(steps[0]).toMatchObject({ title: "Pensando…", done: true })
		expect(steps[1]).toMatchObject({
			title: "Consultando lançamentos",
			done: true,
		})
		expect(steps[2]).toMatchObject({
			title: "Consultando resumo financeiro",
			done: false,
		})
	})

	it("ignora texto e data parts", () => {
		expect(
			deriveThoughtSteps([{ type: "text" }, { type: "data-x" }]),
		).toHaveLength(0)
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
		expect(titles.every((t) => t.done)).toBe(true)
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
