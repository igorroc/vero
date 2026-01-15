import type {Metadata} from "next";
import {getUserBySession} from "@/lib/auth";
import {ProfileContent} from "@/components/profile/profile-content";
import {PageHeader} from "@/components/ui";

export const metadata: Metadata = {
    title: "Perfil | Vero",
};

export default async function ProfilePage() {
    const user = await getUserBySession();

    return (
        <>
            <PageHeader title="Meu Perfil" subtitle="Gerencie suas informações pessoais"/>
            <ProfileContent user={user}/>
        </>
    );
}
