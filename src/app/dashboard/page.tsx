import { redirect } from "next/navigation";
import { getUserBySession } from "@/lib/auth";
import { DashboardContent } from "@/components/dashboard";

export default async function DashboardPage() {
  const user = await getUserBySession();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <main className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <DashboardContent />
      </div>
    </main>
  );
}
