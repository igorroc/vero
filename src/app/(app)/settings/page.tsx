import type {Metadata} from "next";
import {getUserBySession} from "@/lib/auth";
import {SettingsForm} from "@/components/settings";
import {PageHeader} from "@/components/ui";
import prisma from "@/lib/db";

export const metadata: Metadata = {
    title: "Configurações | Vero",
};

export default async function SettingsPage() {
    const user = await getUserBySession();

    if (!user) {
        return null;
    }

    // Get or create user settings
    let settings = await prisma.userSettings.findUnique({
        where: {userId: user.id},
    });

    if (!settings) {
        settings = await prisma.userSettings.create({
            data: {
                userId: user.id,
                safetyBuffer: 0,
                horizonMode: "END_OF_MONTH",
            },
        });
    }

    return (
        <>
            <PageHeader title="Configurações" subtitle="Personalize seu copiloto financeiro"/>
            <div className="max-w-2xl">
                <SettingsForm
                    initialSettings={{
                        safetyBuffer: settings.safetyBuffer,
                        horizonMode: settings.horizonMode,
                    }}
                />
            </div>
        </>
    );
}
