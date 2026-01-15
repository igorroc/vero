"use client";

import {useEffect, useState} from "react";
import {Spinner, Button, Chip} from "@nextui-org/react";
import Link from "next/link";
import {
    TrendingUp,
    Calendar,
    AlertTriangle,
    ChevronRight,
    Landmark,
    Banknote,
    PiggyBank,
    Target,
    CreditCard,
} from "lucide-react";
import {getDashboardData, type DashboardData} from "@/features/dashboard";
import {formatCurrency} from "@/types/finance";

export function DashboardContent() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        setLoading(true);
        setError(null);

        const result = await getDashboardData();

        if (result.success) {
            setData(result.data);
        } else {
            setError(result.error);
        }

        setLoading(false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Spinner size="lg" label="Carregando dashboard..."/>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <p className="text-red-500">{error}</p>
                <Button color="primary" onPress={loadDashboard}>
                    Tentar Novamente
                </Button>
            </div>
        );
    }

    if (!data) {
        return null;
    }

    const breakdown = data.spendingLimit.breakdown;
    // Calculate spending used as percentage of available
    const totalRequiredExpenses = breakdown.requiredExpenses + breakdown.plannedInvestments;
    const spendingUsedPercent = breakdown.cashNow > 0
        ? Math.min(100, (totalRequiredExpenses / breakdown.cashNow) * 100)
        : 0;

    // Calculate income and expenses from net change
    const netChange = data.projectionSummary.netChange;
    // If net change is positive, we have more income than expenses
    // Use avgDailySpend * 30 as an estimate of total expenses
    const estimatedTotalExpenses = Math.abs(data.projectionSummary.avgDailySpend * 30);
    const estimatedTotalIncome = netChange + estimatedTotalExpenses;

    return (
        <div className="space-y-4 sm:space-y-6 max-w-4xl mx-auto">
            {/* Main Balance Card - Inspired by Figma */}
            <div
                className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 rounded-2xl sm:rounded-3xl p-5 sm:p-6 text-white relative overflow-hidden">
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-32 h-32 sm:w-40 sm:h-40">
                    <div
                        className="absolute top-4 right-4 w-12 h-12 sm:w-16 sm:h-16 bg-pink-500/40 rounded-full blur-sm"/>
                    <div className="absolute top-8 right-12 w-8 h-8 sm:w-10 sm:h-10 bg-yellow-400/60 rounded-full"/>
                    <div className="absolute top-16 right-6 w-6 h-6 sm:w-8 sm:h-8 bg-cyan-400/50 rounded-full"/>
                </div>
                <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-blue-500/20 rounded-full blur-xl"/>

                <div className="relative z-10">
                    <p className="text-indigo-200 text-sm font-medium">Saldo disponível</p>
                    <p className="text-3xl sm:text-4xl font-bold mt-1 tracking-tight">
                        {formatCurrency(data.totalBalance)}
                    </p>

                    <Link
                        href="/accounts"
                        className="inline-flex items-center gap-1 text-sm font-semibold text-white mt-4 hover:text-indigo-200 transition-colors"
                    >
                        Ver detalhes <ChevronRight className="w-4 h-4"/>
                    </Link>
                </div>
            </div>

            {/* Budget Card */}
            <div className="bg-gradient-to-r from-indigo-900 to-indigo-800 rounded-2xl p-4 sm:p-5 text-white">
                <div className="flex justify-between items-center">
                    <div>
                        <p className="text-indigo-200 text-xs sm:text-sm font-medium">Orçamento do período</p>
                        <p className="text-xs text-indigo-300 mt-0.5">Disponível para gastar</p>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold">
                        {formatCurrency(breakdown.availableForSpending)}
                    </p>
                </div>
            </div>

            {/* Alerts Section - Compact */}
            {(data.criticalEvents.length > 0 || data.projectionSummary.daysUntilNegative !== null) && (
                <div className="space-y-3">
                    {data.criticalEvents.length > 0 && (
                        <div
                            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-red-100 dark:bg-red-800 rounded-xl flex-shrink-0">
                                    <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400"/>
                                </div>
                                <div className="min-w-0">
                                    <p className="font-semibold text-red-800 dark:text-red-200 text-sm">
                                        {data.criticalEvents.length} evento(s) crítico(s)
                                    </p>
                                    <p className="text-xs text-red-600 dark:text-red-300 truncate">
                                        {data.criticalEvents[0]?.description}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {data.projectionSummary.daysUntilNegative !== null && (
                        <div
                            className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-amber-100 dark:bg-amber-800 rounded-xl flex-shrink-0">
                                    <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400"/>
                                </div>
                                <div>
                                    <p className="font-semibold text-amber-800 dark:text-amber-200 text-sm">
                                        Saldo negativo em {data.projectionSummary.daysUntilNegative} dias
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Spending Limit Card */}
            {breakdown.isNegative ? (
                <div
                    className="bg-red-50 dark:bg-red-900/20 rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-red-200 dark:border-red-800">
                    <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-red-800 dark:text-red-200 text-base">
                                Saldo insuficiente
                            </p>
                            <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                                Você precisa receber {formatCurrency(Math.abs(breakdown.availableForSpending))} nos
                                próximos {breakdown.daysUntilHorizon} dias para cobrir suas despesas planejadas
                            </p>
                        </div>
                        <div
                            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center flex-shrink-0 ml-4">
                            <AlertTriangle className="w-6 h-6 sm:w-7 sm:h-7 text-white"/>
                        </div>
                    </div>
                </div>
            ) : (
                <div
                    className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-900 dark:text-white text-base">
                                Limite diário seguro
                            </p>
                            <p className="text-sm text-slate-500 mt-1">
                                Você pode gastar {formatCurrency(breakdown.dailyLimit)} por dia nos
                                próximos {breakdown.daysUntilHorizon} dias
                            </p>
                        </div>
                        <div
                            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center flex-shrink-0 ml-4">
                            <Target className="w-6 h-6 sm:w-7 sm:h-7 text-white"/>
                        </div>
                    </div>
                </div>
            )}

            {/* Cash Section Title */}
            <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white pt-2">
                Resumo
            </h2>

            {/* Income & Expense Cards - Figma Style */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {/* Income Card */}
                <div
                    className="bg-cyan-100 dark:bg-cyan-900/30 rounded-2xl sm:rounded-3xl p-4 sm:p-5 relative overflow-hidden">
                    <div
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/80 dark:bg-slate-800 flex items-center justify-center mb-8 sm:mb-12">
                        <Landmark className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-600 dark:text-cyan-400"/>
                    </div>
                    <div>
                        <p className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                            {formatCurrency(estimatedTotalIncome)}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                            Receitas
                        </p>
                    </div>
                </div>

                {/* Expense Card */}
                <div
                    className="bg-pink-100 dark:bg-pink-900/30 rounded-2xl sm:rounded-3xl p-4 sm:p-5 relative overflow-hidden">
                    <div
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/80 dark:bg-slate-800 flex items-center justify-center mb-8 sm:mb-12">
                        <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-pink-600 dark:text-pink-400"/>
                    </div>
                    <div>
                        <p className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                            {formatCurrency(estimatedTotalExpenses)}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                            Despesas
                        </p>
                    </div>
                </div>
            </div>

            {/* Accounts Section */}
            <div
                className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">
                        Contas
                    </h2>
                    <Link
                        href="/accounts"
                        className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                        Ver todas <ChevronRight className="w-4 h-4"/>
                    </Link>
                </div>

                <div className="space-y-3">
                    {data.accounts.slice(0, 3).map((account) => {
                        const AccountIcon = account.type === "BANK" ? Landmark :
                            account.type === "CASH" ? Banknote : TrendingUp;
                        const bgColor = account.type === "BANK" ? "bg-blue-100 dark:bg-blue-900/30" :
                            account.type === "CASH" ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-purple-100 dark:bg-purple-900/30";
                        const iconColor = account.type === "BANK" ? "text-blue-600 dark:text-blue-400" :
                            account.type === "CASH" ? "text-emerald-600 dark:text-emerald-400" : "text-purple-600 dark:text-purple-400";

                        return (
                            <div
                                key={account.id}
                                className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl ${bgColor} flex items-center justify-center`}>
                                        <AccountIcon className={`w-5 h-5 ${iconColor}`}/>
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm text-slate-900 dark:text-white">
                                            {account.name}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {account.type === "CASH" ? "Dinheiro" :
                                                account.type === "BANK" ? "Banco" : "Investimento"}
                                        </p>
                                    </div>
                                </div>
                                <p className={`font-bold text-sm ${
                                    account.currentBalance >= 0 ? "text-slate-900 dark:text-white" : "text-red-600"
                                }`}>
                                    {formatCurrency(account.currentBalance)}
                                </p>
                            </div>
                        );
                    })}

                    {data.accounts.length === 0 && (
                        <div className="text-center py-6">
                            <p className="text-slate-500 text-sm">Nenhuma conta cadastrada</p>
                            <Button
                                as={Link}
                                href="/accounts"
                                color="primary"
                                size="sm"
                                radius="full"
                                className="mt-3"
                            >
                                Adicionar Conta
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Upcoming Events */}
            <div
                className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">
                            Próximos Eventos
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-500">Próximos 7 dias</p>
                    </div>
                    <Link
                        href="/events"
                        className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                        Ver todos <ChevronRight className="w-4 h-4"/>
                    </Link>
                </div>

                {data.upcomingEvents.length === 0 ? (
                    <div className="text-center py-6">
                        <div
                            className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Calendar className="w-6 h-6 text-slate-400"/>
                        </div>
                        <p className="text-slate-500 text-sm">Nenhum evento nos próximos 7 dias</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {data.upcomingEvents.slice(0, 4).map((event) => {
                            const eventDate = new Date(event.date);
                            const isToday = eventDate.toDateString() === new Date().toDateString();

                            return (
                                <div
                                    key={event.id}
                                    className={`flex items-center justify-between p-3 rounded-xl ${
                                        isToday
                                            ? "bg-blue-50 dark:bg-blue-900/20"
                                            : "bg-slate-50 dark:bg-slate-800/50"
                                    }`}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <Chip
                                            size="sm"
                                            variant="flat"
                                            color={event.type === "INCOME" ? "success" : event.type === "INVESTMENT" ? "secondary" : "danger"}
                                            className="text-[10px]"
                                        >
                                            {event.type === "INCOME" ? "+" : "-"}
                                        </Chip>
                                        <div className="min-w-0">
                                            <p className="font-medium text-sm text-slate-900 dark:text-white truncate">
                                                {event.description}
                                            </p>
                                            <p className={`text-xs ${isToday ? "text-blue-600 font-medium" : "text-slate-500"}`}>
                                                {isToday ? "Hoje" : eventDate.toLocaleDateString("pt-BR", {
                                                    day: "numeric",
                                                    month: "short",
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                    <p className={`font-bold text-sm flex-shrink-0 ${
                                        event.amount > 0 ? "text-emerald-600" : "text-slate-900 dark:text-white"
                                    }`}>
                                        {event.amount > 0 ? "+" : ""}{formatCurrency(event.amount)}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
                <Link
                    href="/cashflow"
                    className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md transition-shadow"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                            <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400"/>
                        </div>
                        <div>
                            <p className="font-semibold text-sm text-slate-900 dark:text-white">
                                Fluxo de Caixa
                            </p>
                            <p className="text-xs text-slate-500">
                                Dia a dia
                            </p>
                        </div>
                    </div>
                </Link>

                <Link
                    href="/investments"
                    className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md transition-shadow"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                            <PiggyBank className="w-5 h-5 text-purple-600 dark:text-purple-400"/>
                        </div>
                        <div>
                            <p className="font-semibold text-sm text-slate-900 dark:text-white">
                                Investimentos
                            </p>
                            <p className="text-xs text-slate-500">
                                Metas
                            </p>
                        </div>
                    </div>
                </Link>
            </div>
        </div>
    );
}
