"use server"

import prisma from "@/lib/db"
import { getUserBySession } from "@/lib/auth"
import { AiNotConfiguredError } from "@/lib/ai/client"
import { extractPdfStatement, type PdfTx } from "./parsers/pdf"

const MAX_FILE_BYTES = 10 * 1024 * 1024

export type ExtractPdfActionResult =
	| { success: true; transactions: PdfTx[]; skipped: number; model: string }
	| { success: false; error: string }

/**
 * Extrai transações de um PDF de extrato via IA. Nada é persistido:
 * o retorno vive só na sessão de conciliação.
 */
export async function extractPdfTransactions(
	formData: FormData,
): Promise<ExtractPdfActionResult> {
	try {
		const user = await getUserBySession()
		if (!user) return { success: false, error: "Não autenticado" }

		const accountId = String(formData.get("accountId") ?? "")
		const file = formData.get("file")
		if (!accountId) return { success: false, error: "Selecione uma conta" }
		if (!(file instanceof File)) {
			return { success: false, error: "Anexe um arquivo PDF" }
		}

		const account = await prisma.account.findFirst({
			where: { id: accountId, userId: user.id },
			select: { id: true },
		})
		if (!account) return { success: false, error: "Conta inválida" }
		if (file.size > MAX_FILE_BYTES) {
			return {
				success: false,
				error: "Arquivo maior que 10MB. Fatie por período.",
			}
		}

		const bytes = new Uint8Array(await file.arrayBuffer())
		return await extractPdfStatement(bytes)
	} catch (error) {
		if (error instanceof AiNotConfiguredError) {
			return { success: false, error: error.message }
		}
		console.error("Failed to extract PDF statement:", error)
		return { success: false, error: "Não foi possível extrair o PDF" }
	}
}
