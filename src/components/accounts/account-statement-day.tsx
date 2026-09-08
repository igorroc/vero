import type { AccountStatement } from "@/features/accounts"
import { dateFromInput, formatCurrency } from "@/types/finance"
import { AccountStatementEntry } from "./account-statement-entry"

type StatementDay = AccountStatement["days"][number]

interface AccountStatementDayProps {
	day: StatementDay
}

export function AccountStatementDay({ day }: AccountStatementDayProps) {
	const displayDate = dateFromInput(day.dateKey)

	return (
		<section className="modern-card overflow-hidden">
			<div className="flex items-center justify-between border-b p-4">
				<div>
					<h2 className="font-semibold capitalize">
						{displayDate.toLocaleDateString("pt-BR", {
							weekday: "long",
							day: "numeric",
							month: "long",
							year: "numeric",
						})}
					</h2>
					<p className="text-xs text-slate-500">
						{day.entries.length} movimenta
						{day.entries.length > 1 ? "ções" : "ção"}
					</p>
				</div>
				<div className="text-right">
					<p className="text-xs text-slate-500">Saldo do dia</p>
					<p className="font-semibold">{formatCurrency(day.endingBalance)}</p>
				</div>
			</div>
			{day.entries.map((entry) => (
				<AccountStatementEntry key={entry.id} entry={entry} />
			))}
		</section>
	)
}
