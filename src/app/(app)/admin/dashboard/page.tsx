import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { PageHeader } from "@/components/ui"
import {
	getAdminUsers,
	getCommercialOffers,
	isCurrentUserSuperAdmin,
} from "@/features/admin"
import { getSessionView } from "@/lib/session-view"
import { SessionView } from "@/lib/session-view-types"

export const metadata: Metadata = { title: "Admin Dashboard | Vero" }

export default async function AdminDashboardPage() {
	const isSuperAdmin = await isCurrentUserSuperAdmin()
	if (
		!isSuperAdmin ||
		(await getSessionView(isSuperAdmin)) !== SessionView.ADMIN
	) {
		redirect("/dashboard")
	}

	const [users, offers] = await Promise.all([
		getAdminUsers(),
		getCommercialOffers(),
	])
	const plusUsers = users.filter((user) => user.plan === "PLUS").length
	const activeSubscriptions = users.filter(
		(user) =>
			user.subscription?.status === "ACTIVE" ||
			user.subscription?.status === "CANCELING",
	).length
	const activeOffers = offers.filter((offer) => offer.isActive).length

	return (
		<>
			<PageHeader
				eyebrow="Operação interna"
				title="Dashboard administrativo"
				subtitle="Resumo de usuários, assinaturas e ofertas comerciais."
			/>
			<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				<SummaryCard label="Usuários cadastrados" value={users.length} />
				<SummaryCard label="Com Vero Plus" value={plusUsers} tone="primary" />
				<SummaryCard
					label="Assinaturas em vigência"
					value={activeSubscriptions}
				/>
				<SummaryCard label="Ofertas ativas" value={activeOffers} />
			</div>
		</>
	)
}

function SummaryCard({
	label,
	value,
	tone = "default",
}: {
	label: string
	value: number
	tone?: "default" | "primary"
}) {
	return (
		<div className="modern-card p-5">
			<p className="text-sm text-text-muted">{label}</p>
			<p
				className={`mt-1 text-3xl font-bold ${
					tone === "primary" ? "text-primary" : "text-text-primary"
				}`}
			>
				{value}
			</p>
		</div>
	)
}
