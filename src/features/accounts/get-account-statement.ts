"use server"

import type { AccountType } from "@prisma/client"
import prisma from "@/lib/db"
import { getUserBySession } from "@/lib/auth"
import {
	buildAccountStatement,
	type StatementDay,
} from "@/lib/engines/account-statement"
import { endOfDay, type Cents } from "@/types/finance"

export interface AccountStatement {
	account: {
		id: string
		name: string
		type: AccountType
		initialBalance: Cents
	}
	days: StatementDay[]
	currentBalance: Cents
}

export async function getAccountStatement(
	accountId: string,
): Promise<
	| { success: true; statement: AccountStatement }
	| { success: false; error: string }
> {
	try {
		const user = await getUserBySession()
		if (!user) return { success: false, error: "Não autenticado" }
		const account = await prisma.account.findFirst({
			where: { id: accountId, userId: user.id },
			select: { id: true, name: true, type: true, initialBalance: true },
		})
		if (!account) return { success: false, error: "Conta não encontrada" }
		const events = await prisma.event.findMany({
			where: {
				userId: user.id,
				status: "CONFIRMED",
				date: { lte: endOfDay(new Date()) },
				OR: [{ accountId }, { destinationAccountId: accountId }],
			},
			select: {
				id: true,
				description: true,
				amount: true,
				type: true,
				date: true,
				accountId: true,
				destinationAccountId: true,
			},
			orderBy: [{ date: "asc" }, { createdAt: "asc" }],
		})
		const days = buildAccountStatement({
			initialBalance: account.initialBalance,
			accountId,
			events,
		})
		const currentBalance = days[0]?.endingBalance ?? account.initialBalance
		return { success: true, statement: { account, days, currentBalance } }
	} catch (error) {
		console.error("Failed to fetch account statement:", error)
		return { success: false, error: "Não foi possível carregar o extrato" }
	}
}
