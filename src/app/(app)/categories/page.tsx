import type {Metadata} from "next";
import {CategoriesList} from "@/components/categories";
import {PageHeader} from "@/components/ui";

export const metadata: Metadata = {
    title: "Categorias | Vero",
};

export default function CategoriesPage() {
    return (
        <>
            <PageHeader title="Categorias" subtitle="Organize suas despesas por grupo"/>
            <CategoriesList/>
        </>
    );
}
