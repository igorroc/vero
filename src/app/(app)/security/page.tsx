import type { Metadata } from "next"

import { SecurityContent } from "@/components/security"
import { PageHeader } from "@/components/ui"

export const metadata: Metadata = {
	title: "Segurança | Vero",
}

export default function SecurityPage() {
	return (
		<>
			<PageHeader title="Segurança" subtitle="Proteja o acesso à sua conta" />
			<SecurityContent />
		</>
	)
}
