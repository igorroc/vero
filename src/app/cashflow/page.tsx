import { redirect } from "next/navigation";
import { getUserBySession } from "@/lib/auth";
import { CashflowTimeline } from "@/components/cashflow";

export default async function CashflowPage() {
  const user = await getUserBySession();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <main className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <CashflowTimeline />
      </div>
    </main>
  );
}
