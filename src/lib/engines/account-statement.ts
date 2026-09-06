import { formatDateISO, startOfDay, type Cents } from "@/types/finance"

export interface AccountStatementInput {
	initialBalance: Cents
	accountId: string
	events: Array<{
		id: string
		description: string
		amount: Cents
		type: "INCOME" | "EXPENSE" | "INVESTMENT" | "TRANSFER"
		date: Date
		accountId: string
		destinationAccountId: string | null
	}>
}

export interface StatementEntry {
	id: string
	description: string
	amount: Cents
	type: AccountStatementInput["events"][number]["type"]
	date: Date
	balanceAfter: Cents
	isIncomingTransfer: boolean
}

export interface StatementDay {
	date: Date
	dateKey: string
	entries: StatementEntry[]
	endingBalance: Cents
}

export function buildAccountStatement(
	input: AccountStatementInput,
): StatementDay[] {
	const orderedEvents = [...input.events].sort(
		(a, b) => a.date.getTime() - b.date.getTime(),
	)
	const days = new Map<string, StatementDay>()
	let balance = input.initialBalance

	for (const event of orderedEvents) {
		const isIncomingTransfer =
			event.type === "TRANSFER" &&
			event.destinationAccountId === input.accountId
		const amount = isIncomingTransfer ? -event.amount : event.amount
		balance += amount
		const date = startOfDay(event.date)
		const dateKey = formatDateISO(date)
		const day = days.get(dateKey) ?? {
			date,
			dateKey,
			entries: [],
			endingBalance: balance,
		}
		day.entries.push({
			id: event.id,
			description: event.description,
			amount,
			type: event.type,
			date: event.date,
			balanceAfter: balance,
			isIncomingTransfer,
		})
		day.endingBalance = balance
		days.set(dateKey, day)
	}

	return Array.from(days.values()).sort(
		(a, b) => b.date.getTime() - a.date.getTime(),
	)
}
