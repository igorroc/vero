import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { assertPathInsideCwd } from "@/lib/utils/paths"
import { parseBRMoneyToCents, parseBRDateToISO } from "./normalize"
import { parseStatementCsv } from "./csv"
import { parseStatementOfx } from "./ofx"

function sample(name: string): string {
	// Guard resolve e impede qualquer acesso fora da pasta do projeto
	return readFileSync(
		assertPathInsideCwd(join("docs", "ai-conciliacao", name)),
		"utf-8",
	)
}

describe("parseBRMoneyToCents (sem float)", () => {
	it("converte formatos BR", () => {
		expect(parseBRMoneyToCents("1.000,00")).toBe(100000)
		expect(parseBRMoneyToCents("2.342,98")).toBe(234298)
		expect(parseBRMoneyToCents("-50,00")).toBe(-5000)
		expect(parseBRMoneyToCents("0,01")).toBe(1)
		expect(parseBRMoneyToCents("50.00")).toBe(5000)
		expect(parseBRMoneyToCents("-615.01")).toBe(-61501)
		expect(parseBRMoneyToCents("(50,00)")).toBe(-5000)
		expect(parseBRMoneyToCents("R$ 1.234,56")).toBe(123456)
	})

	it("0,10 + 0,20 exato em centavos", () => {
		expect(parseBRMoneyToCents("0,10")! + parseBRMoneyToCents("0,20")!).toBe(30)
	})

	it("rejeita texto", () => {
		expect(parseBRMoneyToCents("")).toBeNull()
		expect(parseBRMoneyToCents("abc")).toBeNull()
	})
})

describe("parseBRDateToISO", () => {
	it("aceita DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD e OFX YYYYMMDD", () => {
		expect(parseBRDateToISO("21/09/2026")).toBe("2026-09-21")
		expect(parseBRDateToISO("21-09-2026")).toBe("2026-09-21")
		expect(parseBRDateToISO("2026-09-21")).toBe("2026-09-21")
		expect(parseBRDateToISO("20260921")).toBe("2026-09-21")
		expect(parseBRDateToISO("32/13/2026")).toBeNull()
	})
})

describe("parseStatementCsv — Bradesco real", () => {
	it("extrai as duas seções e ignora rodapés", () => {
		const result = parseStatementCsv(
			sample("extrato-bradesco.csv"),
			"bradesco-csv",
		)
		expect(result.success).toBe(true)
		if (!result.success) return
		// 8 linhas na seção 1 (menos COD LANC 0 zerada) + 7 na seção 2 (menos 1 zerada)
		expect(result.transactions).toHaveLength(13)
		const pix = result.transactions.find(
			(tx) => tx.date === "2026-09-14" && tx.amountCents === 100000,
		)
		expect(pix?.description).toMatch(/PIX RECEBIDO/i)
		const debito = result.transactions.find(
			(tx) => tx.date === "2026-09-21" && tx.amountCents === -53544,
		)
		expect(debito?.description).toMatch(/COBRANCA/i)
		expect(result.transactions.every((tx) => tx.amountCents !== 0)).toBe(true)
	})
})

describe("parseStatementCsv — Inter real", () => {
	it("pula metadados e usa coluna única com sinal", () => {
		const result = parseStatementCsv(
			sample("extrato-inter/Extrato-22-08-2026-a-22-09-2026-CSV.csv"),
			"inter-csv",
		)
		expect(result.success).toBe(true)
		if (!result.success) return
		expect(result.transactions).toHaveLength(35)
		const resgate = result.transactions.find(
			(tx) => tx.date === "2026-09-18" && tx.amountCents === 224450,
		)
		expect(resgate?.description).toMatch(/Resgate/i)
		const aplicacao = result.transactions.find(
			(tx) => tx.date === "2026-09-10" && tx.amountCents === -70213,
		)
		expect(aplicacao?.description).toMatch(/Aplica/i)
	})
})

describe("parseStatementOfx — Inter real", () => {
	it("extrai 35 transações SGML com FITID", () => {
		const result = parseStatementOfx(
			sample("extrato-inter/Extrato-22-08-2026-a-22-09-2026-OFX.ofx"),
			"inter-ofx",
		)
		expect(result.success).toBe(true)
		if (!result.success) return
		expect(result.transactions).toHaveLength(35)
		const first = result.transactions.find((tx) => tx.fitId === "202609210771")
		expect(first?.date).toBe("2026-09-21")
		expect(first?.amountCents).toBe(5000)
		expect(first?.description).toMatch(/Resgate/i)
		const payment = result.transactions.find(
			(tx) => tx.fitId === "202609010773",
		)
		expect(payment?.amountCents).toBe(-96251)
		expect(
			result.transactions.every((tx) => tx.fitId && tx.fitId.length > 0),
		).toBe(true)
	})

	it("CSV e OFX do Inter representam o mesmo conjunto", () => {
		const csv = parseStatementCsv(
			sample("extrato-inter/Extrato-22-08-2026-a-22-09-2026-CSV.csv"),
			"inter-csv",
		)
		const ofx = parseStatementOfx(
			sample("extrato-inter/Extrato-22-08-2026-a-22-09-2026-OFX.ofx"),
			"inter-ofx",
		)
		expect(csv.success && ofx.success).toBe(true)
		if (!csv.success || !ofx.success) return
		const key = (tx: { date: string; amountCents: number }) =>
			`${tx.date}|${tx.amountCents}`
		const csvKeys = csv.transactions.map(key).sort()
		const ofxKeys = ofx.transactions.map(key).sort()
		expect(ofxKeys).toEqual(csvKeys)
	})
})
