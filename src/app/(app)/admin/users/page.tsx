import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { AdminUsersContent } from "@/components/admin"
import { PageHeader } from "@/components/ui"
import { getAdminUsers, isCurrentUserSuperAdmin } from "@/features/admin"
import { getSessionView } from "@/lib/session-view"
import { SessionView } from "@/lib/session-view-types"

export const metadata: Metadata = { title: "Admin Users | Vero" }

export default async function AdminUsersPage() {
	const isSuperAdmin = await isCurrentUserSuperAdmin()
	if (
		!isSuperAdmin ||
		(await getSessionView(isSuperAdmin)) !== SessionView.ADMIN
	) {
		redirect("/dashboard")
	}

	const users = await getAdminUsers()

	return (
		<>
			<PageHeader
				eyebrow="Operação interna"
				title="Usuários"
				subtitle="Acompanhe os usuários cadastrados, seus acessos e assinaturas."
			/>
			<AdminUsersContent users={users} />
		</>
	)
}
