"use server"

import prisma from "@/lib/db"
import { getUserBySession } from "@/lib/auth"

export type DeleteCategoryResult =
	{ success: true } | { success: false; error: string }

export async function deleteCategory(
	categoryId: string,
): Promise<DeleteCategoryResult> {
	try {
		const user = await getUserBySession()
		if (!user) return { success: false, error: "Não autenticado" }

		const category = await prisma.category.findFirst({
			where: { id: categoryId, userId: user.id },
			select: { _count: { select: { events: true } } },
		})
		if (!category) return { success: false, error: "Categoria não encontrada" }
		if (category._count.events > 0) {
			return {
				success: false,
				error: "Categorias usadas em eventos não podem ser excluídas",
			}
		}

		await prisma.category.delete({ where: { id: categoryId } })
		return { success: true }
	} catch (error) {
		console.error("Failed to delete category:", error)
		return { success: false, error: "Não foi possível excluir a categoria" }
	}
}
