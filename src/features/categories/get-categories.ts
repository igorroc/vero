"use server";

import prisma from "@/lib/db";
import {getUserBySession} from "@/lib/auth";
import type {Category, CategoryGroup} from "@prisma/client";

export type CategoryWithGroup = Category & {categoryGroup: CategoryGroup};

export type CategoryGroupWithCategories = CategoryGroup & {
    categories: Category[];
};

export type GetCategoriesResult =
    | {success: true; categories: CategoryWithGroup[]}
    | {success: false; error: string};

export type GetCategoryGroupsResult =
    | {success: true; groups: CategoryGroupWithCategories[]}
    | {success: false; error: string};

export async function getCategories(): Promise<GetCategoriesResult> {
    try {
        const user = await getUserBySession();
        if (!user) return {success: false, error: "Não autenticado"};

        const categories = await prisma.category.findMany({
            where: {userId: user.id},
            include: {categoryGroup: true},
            orderBy: [{categoryGroup: {type: "asc"}}, {categoryGroup: {name: "asc"}}, {name: "asc"}],
        });

        return {success: true, categories};
    } catch (error) {
        console.error("Failed to fetch categories:", error);
        return {success: false, error: "Não foi possível carregar as categorias"};
    }
}

export async function getCategoryGroups(): Promise<GetCategoryGroupsResult> {
    try {
        const user = await getUserBySession();
        if (!user) return {success: false, error: "Não autenticado"};

        const groups = await prisma.categoryGroup.findMany({
            include: {
                categories: {
                    where: {userId: user.id},
                    orderBy: {name: "asc"},
                },
            },
            orderBy: [{type: "asc"}, {name: "asc"}],
        });

        return {success: true, groups};
    } catch (error) {
        console.error("Failed to fetch category groups:", error);
        return {success: false, error: "Não foi possível carregar os grupos de categorias"};
    }
}
