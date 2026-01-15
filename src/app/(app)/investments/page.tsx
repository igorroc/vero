import type {Metadata} from "next";
import {InvestmentsList, NetWorthGoalCard} from "@/components/investments";
import {PageHeader} from "@/components/ui";

export const metadata: Metadata = {
    title: "Investimentos | Vero",
};

export default function InvestmentsPage() {
    return (
        <>
            <PageHeader title="Investimentos" subtitle="Acompanhe suas metas e planos"/>
            <div className="space-y-8">
                <NetWorthGoalCard/>
                <InvestmentsList/>
            </div>
        </>
    );
}
