import { DebtsContent } from "@/components/debts"

export default async function DebtPage({
	params,
}: {
	params: Promise<{ debtId: string }>
}) {
	const { debtId } = await params
	return <DebtsContent debtId={debtId} />
}
