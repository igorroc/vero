import prisma from "@/lib/db"
import { initialPlanCapabilities } from "@/features/billing/capabilities"

async function main() {
	await prisma.planCapability.createMany({
		data: initialPlanCapabilities,
		skipDuplicates: true,
	})
}

main()
	.catch((error) => {
		console.error("Failed to seed plan capabilities", error)
		process.exitCode = 1
	})
	.finally(async () => {
		await prisma.$disconnect()
	})
