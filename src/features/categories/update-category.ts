"use server"

import { Prisma } from "@prisma/client"
import prisma from "@/lib/db"
import { getUserBySession } from "@/lib/auth"

export interface UpdateCategoryInput {
	id: string
	name: string
	categoryGroupId: string
}

export type UpdateCategoryResult =
	{ success: true } | { success: false; error: string }

export async function updateCategory(
	input: UpdateCategoryInput,
): Promise<UpdateCategoryResult> {
	try {
		const user = await getUserBySession()
		if (!user) return { success: false, error: "Não autenticado" }

		const name = input.name.trim()
		if (!name)
			return { success: false, error: "O nome da categoria é obrigatório" }

		const category = await prisma.category.findFirst({
			where: { id: input.id, userId: user.id },
			select: { id: true },
		})
		if (!category) return { success: false, error: "Categoria não encontrada" }

		const categoryGroup = await prisma.categoryGroup.findUnique({
			where: { id: input.categoryGroupId },
			select: { id: true },
		})
		if (!categoryGroup)
			return { success: false, error: "Grupo de categoria inválido" }

		await prisma.category.update({
			where: { id: category.id },
			data: { name, categoryGroupId: categoryGroup.id },
		})

		return { success: true }
	} catch (error) {
		if (
			error instanceof Prisma.PrismaClientKnownRequestError &&
			error.code === "P2002"
		) {
			return {
				success: false,
				error: "Já existe uma categoria com este nome neste grupo",
			}
		}
		console.error("Failed to update category:", error)
		return { success: false, error: "Não foi possível atualizar a categoria" }
	}
}
