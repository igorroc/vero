import { redirect } from "next/navigation"
import { getUserBySession } from "@/lib/auth"
import { AppLayout } from "@/components/layout"
import { getAccountBalances } from "@/features/accounts"
import { isCurrentUserSuperAdmin } from "@/features/admin"

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
	const accounts = accountBalances.success ? accountBalances.accounts : []

	return (
		<AppLayout
			userName={user.name}
			userEmail={user.email}
			accounts={accounts}
			isSuperAdmin={isSuperAdmin}
		>
			{children}
		</AppLayout>
	)
}
