import type { Metadata } from "next"
import { redirect } from "next/navigation"

import {
	CommercialOffersContent,
	PlanCapabilitiesContent,
} from "@/components/admin"
import { PageHeader } from "@/components/ui"
import {
	getCommercialOffers,
	getPlanCapabilityConfigurations,
	isCurrentUserSuperAdmin,
} from "@/features/admin"
import { getSessionView } from "@/lib/session-view"
import { SessionView } from "@/lib/session-view-types"

export const metadata: Metadata = { title: "Plans | Vero" }

export default async function AdminPlansPage() {
	const isSuperAdmin = await isCurrentUserSuperAdmin()
	if (
		!isSuperAdmin ||
		(await getSessionView(isSuperAdmin)) !== SessionView.ADMIN
	) {
		redirect("/dashboard")
	}

	const [configurations, offers] = await Promise.all([
		getPlanCapabilityConfigurations(),
		getCommercialOffers(),
	])

	return (
		<>
			<PageHeader
				eyebrow="Operação interna"
				title="Planos e cobrança"
				subtitle="Configure capacidades, limites e ofertas comerciais por provedor."
			/>
			<div className="space-y-8">
				<PlanCapabilitiesContent configurations={configurations} />
				<CommercialOffersContent offers={offers} />
			</div>
		</>
	)
}
