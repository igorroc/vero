import { AccountStatementContent } from "@/components/accounts"

export default async function AccountStatementPage({
	params,
}: {
	params: Promise<{ accountId: string }>
}) {
	const { accountId } = await params
	return <AccountStatementContent accountId={accountId} />
}
