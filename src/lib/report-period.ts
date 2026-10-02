export const PERIOD_PARAM = "mes"

export interface ReportPeriod {
	year: number
	month: number
}

/** Lê "YYYY-MM"; cai para o mês atual se ausente ou inválido. Puro. */
export function parsePeriodParam(
	value: string | null | undefined,
	now: Date = new Date(),
): ReportPeriod {
	if (value) {
		const match = /^(\d{4})-(\d{2})$/.exec(value)
		if (match) {
			const year = Number(match[1])
			const month = Number(match[2])
			if (year >= 2000 && year <= 2100 && month >= 1 && month <= 12) {
				return { year, month }
			}
		}
	}
	return { year: now.getFullYear(), month: now.getMonth() + 1 }
}

/** Formata "YYYY-MM". Puro. */
export function formatPeriodParam(year: number, month: number): string {
	return `${year}-${String(month).padStart(2, "0")}`
}
