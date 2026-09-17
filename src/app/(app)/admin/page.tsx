import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { AdminUsersContent, CommercialOffersContent } from "@/components/admin"
import { PageHeader } from "@/components/ui"
import {
	getAdminUsers,
	getCommercialOffers,
	isCurrentUserSuperAdmin,
} from "@/features/admin"

export const metadata: Metadata = {
	title: "Super Admin | Vero",
}

export default async function AdminPage() {
	if (!(await isCurrentUserSuperAdmin())) {
		redirect("/dashboard")
	}

	const [users, offers] = await Promise.all([getAdminUsers(), getCommercialOffers()])

	return (
		<>
			<PageHeader
				eyebrow="Operação interna"
				title="Painel de Super Admin"
				subtitle="Acompanhe os usuários cadastrados, seus acessos e assinaturas."
			/>
			<AdminUsersContent users={users} />
			<CommercialOffersContent offers={offers} />
		</>
	)
}
