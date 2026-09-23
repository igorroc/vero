/**
 * Normalização de moeda e data de extratos — sem ponto flutuante.
 * Todas as conversões partem de string para centavos (int).
 */

export function parseBRMoneyToCents(raw: string): number | null {
	const text = raw.trim()
	if (!text) return null
	let negative = false
	let value = text
	// Parênteses = negativo: (50,00)
	if (value.startsWith("(") && value.endsWith(")")) {
		negative = true
		value = value.slice(1, -1)
	}
	// Remove símbolo de moeda e espaços
	value = value.replace(/[R$\s\u00a0]/g, "")
	if (value.startsWith("-")) {
		negative = true
		value = value.slice(1)
	} else if (value.startsWith("+")) {
		value = value.slice(1)
	}
	if (!/^[\d.,]+$/.test(value)) return null
	// Último separador (ponto ou vírgula) é o decimal
	const lastDot = value.lastIndexOf(".")
	const lastComma = value.lastIndexOf(",")
	const decimalAt = Math.max(lastDot, lastComma)
	let intPart = value
	let fracPart = ""
	if (decimalAt >= 0) {
		intPart = value.slice(0, decimalAt).replace(/[.,]/g, "")
		fracPart = value.slice(decimalAt + 1).replace(/[.,]/g, "")
	} else {
		intPart = value.replace(/[.,]/g, "")
	}
	if (!/^\d+$/.test(intPart) || intPart === "") return null
	if (fracPart !== "" && !/^\d+$/.test(fracPart)) return null
	// Normaliza para 2 casas sem float
	const frac = (fracPart + "00").slice(0, 2)
	const cents = Number.parseInt(intPart, 10) * 100 + Number.parseInt(frac, 10)
	if (!Number.isSafeInteger(cents)) return null
	return negative ? -cents : cents
}

/** Aceita DD/MM/YYYY, DD-MM-YYYY e YYYY-MM-DD. Retorna YYYY-MM-DD ou null. */
export function parseBRDateToISO(raw: string): string | null {
	const text = raw.trim()
	if (!text) return null
	let match = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
	if (match) {
		const [, day, month, year] = match
		return toISO(year, month, day)
	}
	match = text.match(/^(\d{2})-(\d{2})-(\d{4})$/)
	if (match) {
		const [, day, month, year] = match
		return toISO(year, month, day)
	}
	match = text.match(/^(\d{4})-(\d{2})-(\d{2})$/)
	if (match) {
		const [, year, month, day] = match
		return toISO(year, month, day)
	}
	// OFX DTPOSTED: YYYYMMDD (com sufixo de hora opcional)
	match = text.match(/^(\d{4})(\d{2})(\d{2})/)
	if (match && text.length >= 8 && /^\d+$/.test(text.slice(0, 8))) {
		const [, year, month, day] = match
		return toISO(year, month, day)
	}
	return null
}

function toISO(year: string, month: string, day: string): string | null {
	const y = Number.parseInt(year, 10)
	const m = Number.parseInt(month, 10)
	const d = Number.parseInt(day, 10)
	if (m < 1 || m > 12 || d < 1 || d > 31) return null
	const date = new Date(Date.UTC(y, m - 1, d))
	if (
		date.getUTCFullYear() !== y ||
		date.getUTCMonth() !== m - 1 ||
		date.getUTCDate() !== d
	) {
		return null
	}
	return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
}
