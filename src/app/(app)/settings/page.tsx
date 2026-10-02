import type { Metadata } from "next"
import { getUserBySession } from "@/lib/auth"
import { McpTokens, SettingsForm } from "@/components/settings"
import { PageHeader } from "@/components/ui"
import { listMcpTokens } from "@/features/mcp"
import prisma from "@/lib/db"

export const metadata: Metadata = {
	title: "Configurações | Vero",
}

export default async function SettingsPage() {
	const user = await getUserBySession()

	if (!user) {
		return null
	}

	const tokensResult = await listMcpTokens()
	const mcpTokens = tokensResult.success ? tokensResult.tokens : []

	// Get or create user settings
	let settings = await prisma.userSettings.findUnique({
		where: { userId: user.id },
	})

	if (!settings) {
		settings = await prisma.userSettings.create({
			data: {
				userId: user.id,
				safetyBuffer: 0,
				horizonMode: "END_OF_MONTH",
			},
		})
	}

	return (
		<>
			<PageHeader
				title="Configurações"
				subtitle="Personalize seu copiloto financeiro"
			/>
			<div className="space-y-6">
				<SettingsForm
					initialSettings={{
						safetyBuffer: settings.safetyBuffer,
						horizonMode: settings.horizonMode,
					}}
				/>
				<McpTokens initialTokens={mcpTokens} />
			</div>
		</>
	)
}
