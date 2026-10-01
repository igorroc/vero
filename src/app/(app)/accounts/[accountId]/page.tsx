import type { Metadata } from "next"
import { AccountStatementContent } from "@/components/accounts"
import { getAccountById } from "@/features/accounts"

export async function generateMetadata({
	params,
}: {
	params: Promise<{ accountId: string }>
}): Promise<Metadata> {
	const { accountId } = await params
	const account = await getAccountById(accountId)
	return {
		title: account ? `Extrato de ${account.name} | Vero` : "Extrato | Vero",
		description: account
			? `Movimentações confirmadas da conta ${account.name}.`
			: "Extrato da conta bancária.",
	}
}

export default async function AccountStatementPage({
	params,
}: {
	params: Promise<{ accountId: string }>
}) {
	const { accountId } = await params
	return <AccountStatementContent accountId={accountId} />
}
