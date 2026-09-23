"use server"

import { User } from "@prisma/client"
import { cookies } from "next/headers"
import { JWTPayload, SignJWT, jwtVerify } from "jose"

import { env } from "./env"
import {
	SESSION_COOKIE_NAME,
	resolveSessionDuration,
} from "./auth-session"
import { SESSION_VIEW_COOKIE } from "./session-view-types"

const secretKey = env.AUTHENTICATION_SECRET_KEY
const key = new TextEncoder().encode(secretKey)

export async function encrypt(payload: any, maxAgeSeconds: number) {
	const expiration = Math.floor(Date.now() / 1000) + maxAgeSeconds
	return await new SignJWT(payload)
		.setProtectedHeader({ alg: "HS256" })
		.setIssuedAt()
		.setExpirationTime(expiration)
		.sign(key)
}

export async function decrypt(input: string): Promise<JWTPayload | null> {
	try {
		const { payload } = await jwtVerify(input, key, {
			algorithms: ["HS256"],
		})
		return payload
	} catch (error) {
		return null
	}
}

export async function authenticateLogin(
	user: User,
	options?: { rememberMe?: boolean },
) {
	const rememberMe = options?.rememberMe ?? false
	const { maxAge } = resolveSessionDuration(rememberMe)
	const session = await encrypt({ user, rememberMe }, maxAge)

	const awaitedCookies = await cookies()
	awaitedCookies.set(SESSION_COOKIE_NAME, session, {
		httpOnly: true,
		path: "/",
		maxAge,
		sameSite: "lax",
		secure: env.NODE_ENV === "production",
	})
}
export async function authenticateLogout() {
	const awaitedCookies = await cookies()
	const expiredCookie = { httpOnly: true, expires: new Date(0), path: "/" }
	awaitedCookies.set(SESSION_COOKIE_NAME, "", expiredCookie)
	awaitedCookies.set(SESSION_VIEW_COOKIE, "", expiredCookie)
}

export async function getSession() {
	const awaitedCookies = await cookies()
	const session = awaitedCookies.get(SESSION_COOKIE_NAME)
	if (!session || !session.value) return null
	const payload = await decrypt(session.value)

	if (!payload || !payload.exp || payload.exp < Date.now() / 1000) {
		return null
	}

	return payload
}

export async function getUserBySession() {
	const session = await getSession()
	if (!session || !session.user) return null
	return session.user as User
}

/**
 * Indica se a sessão atual foi criada com "Lembrar de mim".
 * Usado para preservar a duração ao renovar a sessão (ex: troca de senha).
 */
export async function isSessionRemembered() {
	const session = await getSession()
	return session?.rememberMe === true
}
