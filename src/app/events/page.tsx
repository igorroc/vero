import {redirect} from "next/navigation";
import {getUserBySession} from "@/lib/auth";
import {EventsList} from "@/components/events";
import {AppLayout} from "@/components/layout";

export default async function EventsPage() {
    const user = await getUserBySession();

    if (!user) {
        redirect("/auth/login");
    }

    return (
        <AppLayout title="Eventos" subtitle="Gerencie seus eventos financeiros" userName={user.name} userEmail={user.email}>
            <EventsList/>
        </AppLayout>
    );
}
