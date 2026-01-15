import type {Metadata} from "next";
import {CashflowTimeline} from "@/components/cashflow";
import {PageHeader} from "@/components/ui";

export const metadata: Metadata = {
    title: "Fluxo de Caixa | Vero",
};

export default function CashflowPage() {
    return (
        <>
            <PageHeader title="Fluxo de Caixa" subtitle="Projeção dia a dia"/>
            <CashflowTimeline/>
        </>
    );
}
