"use client";

import {useEffect, useState} from "react";
import {Spinner, Button, Progress} from "@nextui-org/react";
import Link from "next/link";
import {
    Wallet,
    TrendingUp,
    TrendingDown,
    Calendar,
    AlertTriangle,
    ArrowRight,
    DollarSign,
    Target,
    Lightbulb,
    Landmark,
    Banknote,
} from "lucide-react";
import {getDashboardData, type DashboardData} from "@/features/dashboard";
import {formatCurrency} from "@/types/finance";
import {StatCard} from "@/components/ui/stat-card";

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
    const spendingUsedPercent = breakdown.availableForSpending > 0
        ? Math.min(100, ((breakdown.dailyLimit * breakdown.daysUntilHorizon) / breakdown.availableForSpending) * 100)
        : 0;

    return (
        <div className="space-y-6">
            {/* Stat Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Saldo Total"
                    value={formatCurrency(data.totalBalance)}
                    subtitle={`${data.accounts.length} conta(s) ativa(s)`}
                    icon={Wallet}
                    gradient="blue"
                />
                <StatCard
                    title="Limite Diário"
                    value={formatCurrency(breakdown.dailyLimit)}
                    subtitle={`${breakdown.daysUntilHorizon} dias restantes`}
                    icon={DollarSign}
                    gradient="green"
                />
                <StatCard
                    title="Projeção 30 Dias"
                    value={formatCurrency(data.projectionSummary.netChange)}
                    subtitle={data.projectionSummary.netChange >= 0 ? "Saldo positivo" : "Saldo negativo"}
                    icon={data.projectionSummary.netChange >= 0 ? TrendingUp : TrendingDown}
                    gradient={data.projectionSummary.netChange >= 0 ? "purple" : "red"}
                />
                <StatCard
                    title="Gasto Médio/Dia"
                    value={formatCurrency(data.projectionSummary.avgDailySpend)}
                    subtitle="Média dos próximos 30 dias"
                    icon={Target}
                    gradient="orange"
                />
            </div>

            {/* Alerts Section */}
            {(data.criticalEvents.length > 0 || data.projectionSummary.daysUntilNegative !== null || data.prioritySimulation?.suggestion) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data.criticalEvents.length > 0 && (
                        <div className="modern-card p-5 border-l-4 border-l-red-500">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-red-100 rounded-lg">
                                    <AlertTriangle className="w-5 h-5 text-red-600"/>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-900 dark:text-white">
                                        Eventos Críticos
                                    </h3>
                                    <p className="text-sm text-slate-500 mt-1">
                                        {data.criticalEvents.length} evento(s) podem causar saldo negativo
                                    </p>
                                    <ul className="mt-3 space-y-1">
                                        {data.criticalEvents.slice(0, 3).map((event, index) => (
                                            <li key={index} className="text-sm text-red-600">
                                                {event.description}: {formatCurrency(event.amount)}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                    {data.projectionSummary.daysUntilNegative !== null && (
                        <div className="modern-card p-5 border-l-4 border-l-yellow-500">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-yellow-100 rounded-lg">
                                    <AlertTriangle className="w-5 h-5 text-yellow-600"/>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-900 dark:text-white">
                                        Alerta de Saldo
                                    </h3>
                                    <p className="text-sm text-slate-500 mt-1">
                                        Seu saldo ficará negativo em{" "}
                                        <strong className="text-yellow-600">
                                            {data.projectionSummary.daysUntilNegative} dias
                                        </strong>
                                    </p>
                                    <p className="text-xs text-slate-400 mt-2">
                                        Revise seus gastos planejados para evitar problemas.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {data.prioritySimulation?.suggestion && (
                        <div className={`modern-card p-5 border-l-4 ${
                            data.prioritySimulation.wouldRecover ? "border-l-green-500" : "border-l-blue-500"
                        }`}>
                            <div className="flex items-start gap-3">
                                <div className={`p-2 rounded-lg ${
                                    data.prioritySimulation.wouldRecover ? "bg-green-100" : "bg-blue-100"
                                }`}>
                                    <Lightbulb className={`w-5 h-5 ${
                                        data.prioritySimulation.wouldRecover ? "text-green-600" : "text-blue-600"
                                    }`}/>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-900 dark:text-white">
                                        Sugestão Inteligente
                                    </h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                                        {data.prioritySimulation.suggestion}
                                    </p>
                                    {data.prioritySimulation.postponableEvents.length > 0 && (
                                        <div className="mt-3">
                                            <p className="text-xs text-slate-500 mb-2">
                                                Gastos opcionais que podem ser adiados:
                                            </p>
                                            <ul className="space-y-1">
                                                {data.prioritySimulation.postponableEvents.slice(0, 3).map((event) => (
                                                    <li key={event.id}
                                                        className="text-xs text-slate-600 dark:text-slate-400">
                                                        • {event.description}: {formatCurrency(Math.abs(event.amount))}
                                                    </li>
                                                ))}
                                            </ul>
                                            {data.prioritySimulation.postponableEvents.length > 3 && (
                                                <p className="text-xs text-slate-400 mt-1">
                                                    e
                                                    mais {data.prioritySimulation.postponableEvents.length - 3} evento(s)...
                                                </p>
                                            )}
                                        </div>
                                    )}
                                    <Link
                                        href="/events"
                                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 mt-3"
                                    >
                                        Gerenciar prioridades <ArrowRight className="w-3 h-3"/>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Spending Limit Card */}
                <div className="lg:col-span-2 modern-card p-6">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                                Limite de Gastos
                            </h2>
                            <p className="text-sm text-slate-500">
                                Quanto você pode gastar com segurança
                            </p>
                        </div>
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                            {data.horizonMode === "END_OF_MONTH" ? "Fim do Mês" : "Próxima Receita"}
                        </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wide">Saldo Atual</p>
                            <p className="text-lg font-bold text-slate-900 dark:text-white">
                                {formatCurrency(breakdown.cashNow)}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wide">Despesas Futuras</p>
                            <p className="text-lg font-bold text-red-600">
                                -{formatCurrency(breakdown.requiredExpenses)}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wide">Investimentos</p>
                            <p className="text-lg font-bold text-purple-600">
                                -{formatCurrency(breakdown.plannedInvestments)}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wide">Reserva de Segurança</p>
                            <p className="text-lg font-bold text-slate-700 dark:text-slate-300">
                                {formatCurrency(breakdown.safetyBuffer)}
                            </p>
                        </div>
                    </div>

                    <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl p-5 text-white">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-emerald-100 text-sm">Você pode gastar por dia</p>
                                <p className="text-4xl font-bold mt-1">
                                    {formatCurrency(breakdown.dailyLimit)}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-emerald-100 text-sm">Disponível para gastar</p>
                                <p className="text-2xl font-bold mt-1">
                                    {formatCurrency(breakdown.availableForSpending)}
                                </p>
                            </div>
                        </div>
                        <div className="mt-4">
                            <div className="flex justify-between text-sm text-emerald-100 mb-1">
                                <span>Progresso do período</span>
                                <span>{breakdown.daysUntilHorizon} dias restantes</span>
                            </div>
                            <Progress
                                value={spendingUsedPercent}
                                className="h-2"
                                classNames={{
                                    indicator: "bg-white",
                                    track: "bg-emerald-400/30",
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Accounts Summary */}
                <div className="modern-card p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                            Contas
                        </h2>
                        <Link
                            href="/accounts"
                            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                        >
                            Ver todas <ArrowRight className="w-4 h-4"/>
                        </Link>
                    </div>

                    <div className="space-y-3">
                        {data.accounts.slice(0, 4).map((account) => {
                            const AccountIcon = account.type === "BANK" ? Landmark :
                                account.type === "CASH" ? Banknote : TrendingUp;
                            const gradient = account.type === "BANK" ? "from-blue-500 to-blue-600" :
                                account.type === "CASH" ? "from-green-500 to-emerald-600" : "from-purple-500 to-violet-600";
                            return (
                                <div
                                    key={account.id}
                                    className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-xl"
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                                            <AccountIcon className="w-5 h-5 text-white"/>
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-900 dark:text-white">
                                                {account.name}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {account.type === "CASH" ? "Dinheiro" :
                                                    account.type === "BANK" ? "Conta Bancária" :
                                                        "Investimento"}
                                            </p>
                                        </div>
                                    </div>
                                    <p className={`font-bold ${
                                        account.currentBalance >= 0 ? "text-slate-900 dark:text-white" : "text-red-600"
                                    }`}>
                                        {formatCurrency(account.currentBalance)}
                                    </p>
                                </div>
                            );
                        })}

                        {data.accounts.length === 0 && (
                            <div className="text-center py-8">
                                <p className="text-slate-500 text-sm">Nenhuma conta cadastrada</p>
                                <Button
                                    as={Link}
                                    href="/accounts"
                                    color="primary"
                                    size="sm"
                                    className="mt-3"
                                >
                                    Adicionar Conta
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Upcoming Events */}
            <div className="modern-card p-6">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                            Próximos Eventos
                        </h2>
                        <p className="text-sm text-slate-500">Próximos 7 dias</p>
                    </div>
                    <Link
                        href="/events"
                        className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                        Ver todos <ArrowRight className="w-4 h-4"/>
                    </Link>
                </div>

                {data.upcomingEvents.length === 0 ? (
                    <div className="text-center py-8">
                        <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3"/>
                        <p className="text-slate-500">Nenhum evento nos próximos 7 dias</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {data.upcomingEvents.slice(0, 6).map((event) => {
                            const eventDate = new Date(event.date);
                            const isToday = eventDate.toDateString() === new Date().toDateString();

                            return (
                                <div
                                    key={event.id}
                                    className={`p-4 rounded-xl border ${
                                        isToday
                                            ? "border-blue-200 bg-blue-50 dark:bg-blue-900/20"
                                            : "border-slate-200 dark:border-slate-700"
                                    }`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <span
                                                className={`inline-block px-2 py-0.5 rounded text-xs font-medium mb-2 ${
                                                    event.type === "INCOME"
                                                        ? "bg-green-100 text-green-700"
                                                        : event.type === "INVESTMENT"
                                                            ? "bg-purple-100 text-purple-700"
                                                            : "bg-red-100 text-red-700"
                                                }`}>
                                                {event.type === "INCOME" ? "Receita" :
                                                    event.type === "INVESTMENT" ? "Investimento" : "Despesa"}
                                            </span>
                                            <p className="font-medium text-slate-900 dark:text-white text-sm">
                                                {event.description}
                                            </p>
                                            <p className={`text-xs mt-1 ${isToday ? "text-blue-600 font-medium" : "text-slate-500"}`}>
                                                {isToday ? "Hoje" : eventDate.toLocaleDateString("pt-BR", {
                                                    weekday: "short",
                                                    day: "numeric",
                                                    month: "short",
                                                })}
                                            </p>
                                        </div>
                                        <p className={`font-bold ${
                                            event.amount > 0 ? "text-green-600" : "text-red-600"
                                        }`}>
                                            {event.amount > 0 ? "+" : ""}{formatCurrency(event.amount)}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link
                    href="/cashflow"
                    className="modern-card p-5 hover-lift group"
                >
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 rounded-xl group-hover:bg-blue-200 transition-colors">
                            <Calendar className="w-6 h-6 text-blue-600"/>
                        </div>
                        <div>
                            <p className="font-semibold text-slate-900 dark:text-white">
                                Fluxo de Caixa
                            </p>
                            <p className="text-sm text-slate-500">
                                Projeção dia a dia
                            </p>
                        </div>
                    </div>
                </Link>

                <Link
                    href="/investments"
                    className="modern-card p-5 hover-lift group"
                >
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-100 rounded-xl group-hover:bg-purple-200 transition-colors">
                            <TrendingUp className="w-6 h-6 text-purple-600"/>
                        </div>
                        <div>
                            <p className="font-semibold text-slate-900 dark:text-white">
                                Investimentos
                            </p>
                            <p className="text-sm text-slate-500">
                                Acompanhe suas metas
                            </p>
                        </div>
                    </div>
                </Link>

                <Link
                    href="/settings"
                    className="modern-card p-5 hover-lift group"
                >
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-orange-100 rounded-xl group-hover:bg-orange-200 transition-colors">
                            <Target className="w-6 h-6 text-orange-600"/>
                        </div>
                        <div>
                            <p className="font-semibold text-slate-900 dark:text-white">
                                Configurações
                            </p>
                            <p className="text-sm text-slate-500">
                                Horizonte e reserva
                            </p>
                        </div>
                    </div>
                </Link>
            </div>
        </div>
    );
}
