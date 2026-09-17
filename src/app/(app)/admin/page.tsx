import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { AdminUsersContent } from "@/components/admin"
import { PageHeader } from "@/components/ui"
import { getAdminUsers, isCurrentUserSuperAdmin } from "@/features/admin"

export const metadata: Metadata = {
	title: "Super Admin | Vero",
}

export default async function AdminPage() {
	if (!(await isCurrentUserSuperAdmin())) {
		redirect("/dashboard")
	}

	const users = await getAdminUsers()

	return (
		<>
			<PageHeader
				eyebrow="Operação interna"
				title="Painel de Super Admin"
				subtitle="Acompanhe os usuários cadastrados, seus acessos e assinaturas."
			/>
			<AdminUsersContent users={users} />
		</>
	)
}
