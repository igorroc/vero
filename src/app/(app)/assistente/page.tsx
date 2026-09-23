import type { Metadata } from "next"
import { getUserBySession } from "@/lib/auth"
import { AssistantPageContent } from "@/components/ai-chat"

export const metadata: Metadata = {
	title: "Assistente | Vero",
	description: "Converse com a Vero sobre seus gastos, orçamento e planos.",
}

export default async function AssistentePage() {
	const user = await getUserBySession()
	return <AssistantPageContent userName={user?.name ?? ""} />
}
