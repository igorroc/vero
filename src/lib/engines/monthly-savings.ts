import type { Cents } from "@/types/finance"

export interface MonthlySavingsAmounts {
	/** Entradas do mês (positivas). */
	income: Cents
	/** Despesas do mês (magnitude positiva). */
	expense: Cents
	/** Investimentos/aportes do mês (magnitude positiva). */
	investment: Cents
}

export interface MonthlySavingsInput {
	previsto: MonthlySavingsAmounts
	realizado: MonthlySavingsAmounts
}

export interface MonthlySavingsBreakdown {
	income: Cents
	expense: Cents
	investment: Cents
	/** Economia total: entradas - despesas (investimentos contam como economia). */
	saved: Cents
	/** Caixa livre: economia total - investimentos (o que sobra sem investir). */
	freeCash: Cents
	/** Economia total sobre as entradas, em pontos percentuais. */
	savingsRate: number
}

export interface MonthlySavingsDifference {
	income: Cents
	expense: Cents
	investment: Cents
	saved: Cents
	freeCash: Cents
}

export interface MonthlySavingsResult {
	previsto: MonthlySavingsBreakdown
	realizado: MonthlySavingsBreakdown
	/** Diferença realizada - prevista. */
	difference: MonthlySavingsDifference
}

function buildBreakdown(amounts: MonthlySavingsAmounts): MonthlySavingsBreakdown {
	const saved = amounts.income - amounts.expense
	const freeCash = saved - amounts.investment
	return {
		income: amounts.income,
		expense: amounts.expense,
		investment: amounts.investment,
		saved,
		freeCash,
		savingsRate: amounts.income > 0 ? (saved / amounts.income) * 100 : 0,
	}
}

/**
 * Calcula a capacidade de economia do mês, com leitura prevista e realizada.
 *
 * - "Economia total" (`saved`) = entradas - despesas; um aporte em investimento
 *   conta como economia, pois o dinheiro não foi consumido.
 * - "Caixa livre" (`freeCash`) = economia total - investimentos; é o que sobra
 *   em conta depois de gastar e investir.
 */
export function buildMonthlySavings(
	input: MonthlySavingsInput,
): MonthlySavingsResult {
	const previsto = buildBreakdown(input.previsto)
	const realizado = buildBreakdown(input.realizado)

	return {
		previsto,
		realizado,
		difference: {
			income: realizado.income - previsto.income,
			expense: realizado.expense - previsto.expense,
			investment: realizado.investment - previsto.investment,
			saved: realizado.saved - previsto.saved,
			freeCash: realizado.freeCash - previsto.freeCash,
		},
	}
}
