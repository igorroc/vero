import type {Metadata} from "next";
import {AccountsList} from "@/components/accounts";
import {PageHeader} from "@/components/ui";

export const metadata: Metadata = {
    title: "Contas | Vero",
};

export default function AccountsPage() {
    return (
        <>
            <PageHeader title="Contas" subtitle="Gerencie suas contas bancárias"/>
            <AccountsList/>
        </>
    );
}
