import {redirect} from "next/navigation";
import {getUserBySession} from "@/lib/auth";
import {AccountsList} from "@/components/accounts";
import {AppLayout} from "@/components/layout";

export default async function AccountsPage() {
    const user = await getUserBySession();

    if (!user) {
        redirect("/auth/login");
    }

    return (
        <AppLayout title="Contas" subtitle="Gerencie suas contas bancárias">
            <AccountsList/>
        </AppLayout>
    );
}
