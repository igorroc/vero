import { redirect } from "next/navigation";
import { getUserBySession } from "@/lib/auth";
import { SettingsForm } from "@/components/settings";
import prisma from "@/lib/db";

export default async function SettingsPage() {
  const user = await getUserBySession();

  if (!user) {
    redirect("/auth/login");
  }

  // Get or create user settings
  let settings = await prisma.userSettings.findUnique({
    where: { userId: user.id },
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
    <main className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <SettingsForm
          initialSettings={{
            safetyBuffer: settings.safetyBuffer,
            horizonMode: settings.horizonMode,
          }}
        />
      </div>
    </main>
  );
}
