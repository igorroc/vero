import { redirect } from "next/navigation";
import { getUserBySession } from "@/lib/auth";
import { AccountsList } from "@/components/accounts";

export default async function AccountsPage() {
  const user = await getUserBySession();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <main className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <AccountsList />
      </div>
    </main>
  );
}
