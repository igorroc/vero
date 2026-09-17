"use server"

import { getUserBySession } from "@/lib/auth"
import prisma from "@/lib/db"

export async function requireSuperAdmin(): Promise<{
	id: string
	name: string
	email: string
}> {
	const sessionUser = await getUserBySession()

	if (!sessionUser) {
		throw new Error("UNAUTHENTICATED")
	}

	const user = await prisma.user.findUnique({
		where: { id: sessionUser.id },
		select: {
			id: true,
			name: true,
			email: true,
			superAdminRole: { select: { userId: true } },
		},
	})

	if (!user || !user.superAdminRole) {
		throw new Error("FORBIDDEN")
	}

	return { id: user.id, name: user.name, email: user.email }
}

export async function isCurrentUserSuperAdmin(): Promise<boolean> {
	try {
		await requireSuperAdmin()
		return true
	} catch {
		return false
	}
}
