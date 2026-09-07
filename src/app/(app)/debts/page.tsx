import type { Metadata } from "next"
import { DebtsContent } from "@/components/debts"
import { PageHeader } from "@/components/ui"

export const metadata: Metadata = { title: "Dívidas | Vero" }

export default function DebtsPage() {
	return <><PageHeader title="Dívidas" subtitle="Planeje a quitação e acompanhe cada pagamento" /><DebtsContent /></>
}
