import { redirect } from "next/navigation";
import { getUserBySession } from "@/lib/auth";
import { EventsList } from "@/components/events";

export default async function EventsPage() {
  const user = await getUserBySession();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <main className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <EventsList />
      </div>
    </main>
  );
}
