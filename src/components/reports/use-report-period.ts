"use client"

import { useCallback, useState } from "react"
import { useSearchParams } from "next/navigation"
import {
	formatPeriodParam,
	parsePeriodParam,
	PERIOD_PARAM,
	type ReportPeriod,
} from "@/lib/report-period"

/**
 * Mantém o mês selecionado nos relatórios sincronizado com a URL (?mes=YYYY-MM).
 * Ao mudar, grava na URL via replaceState (sem recarregar), para persistir no
 * refresh e permitir compartilhar o mesmo relatório.
 */
export function useReportPeriod() {
	const searchParams = useSearchParams()
	const [period, setPeriodState] = useState<ReportPeriod>(() =>
		parsePeriodParam(searchParams.get(PERIOD_PARAM)),
	)

	const setPeriod = useCallback((year: number, month: number) => {
		setPeriodState({ year, month })
		if (typeof window !== "undefined") {
			const url = new URL(window.location.href)
			url.searchParams.set(PERIOD_PARAM, formatPeriodParam(year, month))
			window.history.replaceState(null, "", url.toString())
		}
	}, [])

	return {
		year: period.year,
		month: period.month,
		periodParam: formatPeriodParam(period.year, period.month),
		setPeriod,
	}
}
