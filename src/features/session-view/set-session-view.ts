"use server"

import { cookies } from "next/headers"

import { isCurrentUserSuperAdmin } from "@/features/admin"
import { getUserBySession } from "@/lib/auth"
import { env } from "@/lib/env"
import {
	isSessionView,
	SESSION_VIEW_COOKIE,
	SessionView,
} from "@/lib/session-view-types"

export async function setSessionView(input: string): Promise<{
	success: boolean
	view?: SessionView
	error?: string
}> {
	if (!(await getUserBySession())) {
		return {
			success: false,
			error: "Você precisa entrar para trocar de visão.",
		}
	}

	if (!isSessionView(input)) {
		return { success: false, error: "Visão inválida." }
	}

	if (input === SessionView.PROFESSIONAL) {
		return {
			success: false,
			error: "A visão profissional ainda não está disponível.",
		}
	}

	if (input === SessionView.ADMIN && !(await isCurrentUserSuperAdmin())) {
		return {
			success: false,
			error: "Você não possui acesso à visão administrativa.",
		}
	}

	;(await cookies()).set(SESSION_VIEW_COOKIE, input, {
		httpOnly: true,
		secure: env.NODE_ENV === "production",
		sameSite: "lax",
		path: "/",
		maxAge: 60 * 60 * 24 * 365,
	})

	return { success: true, view: input }
}
