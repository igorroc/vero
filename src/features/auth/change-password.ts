"use server"

import bcrypt from "bcrypt"

import { authenticateLogin, getUserBySession, isSessionRemembered } from "@/lib/auth"
import db from "@/lib/db"

export type ChangePasswordInput = {
	currentPassword: string
	newPassword: string
}

export type ChangePasswordResult =
	{ success: true } | { success: false; error: string }

export async function changePassword(
	input: ChangePasswordInput,
): Promise<ChangePasswordResult> {
	const user = await getUserBySession()
	if (!user)
		return { success: false, error: "Sua sessão expirou. Entre novamente." }

	if (!input.currentPassword || !input.newPassword) {
		return { success: false, error: "Preencha a senha atual e a nova senha." }
	}
	if (input.newPassword.length < 8) {
		return {
			success: false,
			error: "A nova senha deve ter ao menos 8 caracteres.",
		}
	}
	if (input.currentPassword === input.newPassword) {
		return {
			success: false,
			error: "A nova senha deve ser diferente da senha atual.",
		}
	}

	const isCurrentPasswordValid = await bcrypt.compare(
		input.currentPassword,
		user.password,
	)
	if (!isCurrentPasswordValid) {
		return { success: false, error: "A senha atual não confere." }
	}

	const password = await bcrypt.hash(input.newPassword, 10)
	const updatedUser = await db.user.update({
		where: { id: user.id },
		data: { password },
	})
	await authenticateLogin(updatedUser, {
		rememberMe: await isSessionRemembered(),
	})

	return { success: true }
}
