import { redirect } from "next/navigation"
import { getUserBySession } from "@/lib/auth"
import { AppLayout } from "@/components/layout"
import { AssistantWidget } from "@/components/ai-chat"
import { getAccountBalances } from "@/features/accounts"
import { isCurrentUserSuperAdmin } from "@/features/admin"
import { getSessionView } from "@/lib/session-view"

export default async function AppGroupLayout({
	children,
}: {
	children: React.ReactNode
}) {
	const user = await getUserBySession()

	if (!user) {
		redirect("/auth/login")
	}

	const [accountBalances, isSuperAdmin] = await Promise.all([
		getAccountBalances(),
		isCurrentUserSuperAdmin(),
	])
	const sessionView = await getSessionView(isSuperAdmin)
	const accounts = accountBalances.success ? accountBalances.accounts : []

	return (
		<AppLayout
			userName={user.name}
			userEmail={user.email}
			accounts={accounts}
			isSuperAdmin={isSuperAdmin}
			sessionView={sessionView}
		>
			{children}
			<AssistantWidget userName={user.name} />
		</AppLayout>
	)
}
