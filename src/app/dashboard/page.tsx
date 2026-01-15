import {redirect} from "next/navigation";
import {getUserBySession} from "@/lib/auth";
import {DashboardContent} from "@/components/dashboard";
import {AppLayout} from "@/components/layout";

export default async function DashboardPage() {
    const user = await getUserBySession();

    if (!user) {
        redirect("/auth/login");
    }

    return (
        <AppLayout userName={user.name} userEmail={user.email}>
            <DashboardContent/>
        </AppLayout>
    );
}
