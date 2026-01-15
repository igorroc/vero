import {redirect} from "next/navigation";
import {getUserBySession} from "@/lib/auth";
import {SettingsForm} from "@/components/settings";
import {AppLayout} from "@/components/layout";
import prisma from "@/lib/db";

export default async function SettingsPage() {
    const user = await getUserBySession();

    if (!user) {
        redirect("/auth/login");
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
        <AppLayout title="Configurações" subtitle="Personalize seu copiloto financeiro">
            <div className="max-w-2xl">
                <SettingsForm
                    initialSettings={{
                        safetyBuffer: settings.safetyBuffer,
                        horizonMode: settings.horizonMode,
                    }}
                />
            </div>
        </AppLayout>
    );
}
