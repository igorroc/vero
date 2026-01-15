import {redirect} from "next/navigation";
import {getUserBySession} from "@/lib/auth";
import {CashflowTimeline} from "@/components/cashflow";
import {AppLayout} from "@/components/layout";

export default async function CashflowPage() {
    const user = await getUserBySession();

    if (!user) {
        redirect("/auth/login");
    }

    return (
        <AppLayout title="Fluxo de Caixa" subtitle="Projeção dia a dia" userName={user.name} userEmail={user.email}>
            <CashflowTimeline/>
        </AppLayout>
    );
}
