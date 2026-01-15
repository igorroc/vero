import {redirect} from "next/navigation";
import {getUserBySession} from "@/lib/auth";
import {InvestmentsList, NetWorthGoalCard} from "@/components/investments";
import {AppLayout} from "@/components/layout";

export default async function InvestmentsPage() {
    const user = await getUserBySession();

    if (!user) {
        redirect("/auth/login");
    }

    return (
        <AppLayout title="Investimentos" subtitle="Acompanhe suas metas e planos" userName={user.name} userEmail={user.email}>
            <div className="space-y-8">
                <NetWorthGoalCard/>
                <InvestmentsList/>
            </div>
        </AppLayout>
    );
}
