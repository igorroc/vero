import type {Metadata} from "next";
import {CashflowTimeline} from "@/components/cashflow";

export const metadata: Metadata = {
    title: "Fluxo de Caixa | Vero",
};

export default function CashflowPage() {
    return (
        <div className="max-w-4xl mx-auto">
            {/* Mobile Header */}
            <div className="mb-4 sm:mb-6 md:hidden">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                    Fluxo de Caixa
                </h1>
                <p className="text-sm text-slate-500">
                    Projeção dia a dia
                </p>
            </div>

            {/* Desktop Header */}
            <div className="hidden md:block mb-6">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                    Fluxo de Caixa
                </h1>
                <p className="text-slate-500">
                    Acompanhe sua projeção financeira dia a dia
                </p>
            </div>

            <CashflowTimeline/>
        </div>
    );
}
