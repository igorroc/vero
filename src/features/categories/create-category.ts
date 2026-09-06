"use server";

import {Prisma} from "@prisma/client";
import prisma from "@/lib/db";
import {getUserBySession} from "@/lib/auth";

export interface CreateCategoryInput {
    name: string;
    categoryGroupId: string;
}

export type CreateCategoryResult =
    | {success: true}
    | {success: false; error: string};

export async function createCategory(input: CreateCategoryInput): Promise<CreateCategoryResult> {
    try {
        const user = await getUserBySession();
        if (!user) return {success: false, error: "Não autenticado"};

        const name = input.name.trim();
        if (!name) return {success: false, error: "O nome da categoria é obrigatório"};

        const categoryGroup = await prisma.categoryGroup.findUnique({
            where: {id: input.categoryGroupId},
            select: {id: true},
        });
        if (!categoryGroup) return {success: false, error: "Grupo de categoria inválido"};

        await prisma.category.create({
            data: {name, categoryGroupId: categoryGroup.id, userId: user.id},
        });

        return {success: true};
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            return {success: false, error: "Já existe uma categoria com este nome neste grupo"};
        }
        console.error("Failed to create category:", error);
        return {success: false, error: "Não foi possível criar a categoria"};
    }
}
