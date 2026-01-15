import {redirect} from "next/navigation";
import {getUserBySession} from "@/lib/auth";
import {AppLayout} from "@/components/layout";

export default async function AppGroupLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const user = await getUserBySession();

    if (!user) {
        redirect("/auth/login");
    }

    return (
        <AppLayout userName={user.name} userEmail={user.email}>
            {children}
        </AppLayout>
    );
}
