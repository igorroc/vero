"use client";

import {useEffect, useState} from "react";
import {
    Spinner,
    Button,
    Chip,
    ButtonGroup,
} from "@nextui-org/react";
import {getCashflowProjection} from "@/features/cashflow";
import {formatCurrency, type CashflowProjection, type CashflowDay} from "@/types/finance";
import {StatCard} from "@/components/ui/stat-card";
import {TrendingUp, TrendingDown, PiggyBank, AlertTriangle} from "lucide-react";

export function CashflowTimeline() {
    const [projection, setProjection] = useState<CashflowProjection | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [days, setDays] = useState(30);

    useEffect(() => {
        loadProjection();
    }, [days]);

    const loadProjection = async () => {
        setLoading(true);
        setError(null);

        const result = await getCashflowProjection(days);

        if (result.success) {
            setProjection(result.projection);
        } else {
            setError(result.error);
        }

        setLoading(false);
    };

    const formatDate = (date: Date) => {
        const d = new Date(date);
        return d.toLocaleDateString("pt-BR", {
            weekday: "short",
            month: "short",
            day: "numeric",
        });
    };

    const isToday = (date: Date) => {
        const today = new Date();
        const d = new Date(date);
        return d.toDateString() === today.toDateString();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Spinner size="lg" label="Carregando projeção..."/>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <p className="text-red-500">{error}</p>
                <Button color="primary" onPress={loadProjection}>
                    Tentar Novamente
                </Button>
            </div>
        );
    }

    if (!projection) {
        return null;
    }

    return (
        <div className="space-y-6">
            {/* Period Selector */}
            <div className="flex justify-end">
                <ButtonGroup>
                    <Button
                        color={days === 30 ? "primary" : "default"}
                        variant={days === 30 ? "solid" : "bordered"}
                        onPress={() => setDays(30)}
                    >
                        30 Dias
                    </Button>
                    <Button
                        color={days === 60 ? "primary" : "default"}
                        variant={days === 60 ? "solid" : "bordered"}
                        onPress={() => setDays(60)}
                    >
                        60 Dias
                    </Button>
                    <Button
                        color={days === 90 ? "primary" : "default"}
                        variant={days === 90 ? "solid" : "bordered"}
                        onPress={() => setDays(90)}
                    >
                        90 Dias
                    </Button>
                </ButtonGroup>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                    title="Total de Receitas"
                    value={formatCurrency(projection.totalIncome)}
                    icon={TrendingUp}
                    gradient="green"
                />
                <StatCard
                    title="Total de Despesas"
                    value={formatCurrency(projection.totalExpenses)}
                    icon={TrendingDown}
                    gradient="red"
                />
                <StatCard
                    title="Investimentos"
                    value={formatCurrency(projection.totalInvestments)}
                    icon={PiggyBank}
                    gradient="purple"
                />
                <StatCard
                    title="Variação Líquida"
                    value={formatCurrency(projection.netChange)}
                    subtitle={projection.netChange >= 0 ? "Positivo" : "Negativo"}
                    icon={projection.netChange >= 0 ? TrendingUp : TrendingDown}
                    gradient={projection.netChange >= 0 ? "blue" : "orange"}
                />
            </div>

            {/* Warnings */}
            {projection.negativeDays > 0 && (
                <div className="modern-card p-5 border-l-4 border-l-red-500">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-red-100 rounded-lg">
                            <AlertTriangle className="w-5 h-5 text-red-600"/>
                        </div>
                        <div>
                            <h3 className="font-semibold text-slate-900 dark:text-white">
                                Atenção: {projection.negativeDays} dia(s) com saldo negativo
                            </h3>
                            {projection.lowestBalanceDate && (
                                <p className="text-sm text-slate-500 mt-1">
                                    Menor saldo: {formatCurrency(projection.lowestBalance)} em{" "}
                                    {formatDate(projection.lowestBalanceDate)}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {projection.criticalDays > 0 && projection.negativeDays === 0 && (
                <div className="modern-card p-5 border-l-4 border-l-yellow-500">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                            <AlertTriangle className="w-5 h-5 text-yellow-600"/>
                        </div>
                        <div>
                            <h3 className="font-semibold text-slate-900 dark:text-white">
                                Atenção: {projection.criticalDays} dia(s) abaixo da reserva de segurança
                            </h3>
                        </div>
                    </div>
                </div>
            )}

            {/* Timeline */}
            <div className="modern-card overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                        Detalhamento Diário
                    </h2>
                </div>
                <div className="divide-y divide-slate-200 dark:divide-slate-700">
                    {projection.days.map((day) => (
                        <DayRow key={day.dateKey} day={day} isToday={isToday(day.date)}/>
                    ))}
                </div>
            </div>
        </div>
    );
}

interface DayRowProps {
    day: CashflowDay;
    isToday: boolean;
}

function DayRow({day, isToday}: DayRowProps) {
    const [expanded, setExpanded] = useState(false);

    const formatDate = (date: Date) => {
        const d = new Date(date);
        return d.toLocaleDateString("pt-BR", {
            weekday: "short",
            month: "short",
            day: "numeric",
        });
    };

    return (
        <div
            className={`${
                day.isNegative
                    ? "bg-red-50 dark:bg-red-900/20"
                    : day.isCritical
                        ? "bg-yellow-50 dark:bg-yellow-900/20"
                        : isToday
                            ? "bg-blue-50 dark:bg-blue-900/20"
                            : ""
            }`}
        >
            {/* Main row */}
            <div
                className="flex justify-between items-center p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                onClick={() => day.events.length > 0 && setExpanded(!expanded)}
            >
                <div className="flex items-center gap-3">
                    <span
                        className={`font-medium ${
                            isToday ? "text-blue-600" : "text-slate-900 dark:text-white"
                        }`}
                    >
                        {isToday ? "Hoje" : formatDate(day.date)}
                    </span>
                    {day.events.length > 0 && (
                        <Chip size="sm" variant="flat" className="bg-slate-100 dark:bg-slate-700">
                            {day.events.length} evento{day.events.length > 1 ? "s" : ""}
                        </Chip>
                    )}
                    {day.isNegative && (
                        <Chip color="danger" size="sm">
                            Negativo
                        </Chip>
                    )}
                    {day.isCritical && !day.isNegative && (
                        <Chip color="warning" size="sm">
                            Baixo
                        </Chip>
                    )}
                </div>
                <div className="flex items-center gap-4">
                    {day.netChange !== 0 && (
                        <span
                            className={`text-sm font-medium ${
                                day.netChange > 0 ? "text-green-600" : "text-red-600"
                            }`}
                        >
                            {day.netChange > 0 ? "+" : ""}
                            {formatCurrency(day.netChange)}
                        </span>
                    )}
                    <span
                        className={`font-bold ${
                            day.endingBalance < 0
                                ? "text-red-600"
                                : "text-slate-900 dark:text-white"
                        }`}
                    >
                        {formatCurrency(day.endingBalance)}
                    </span>
                    {day.events.length > 0 && (
                        <span className="text-slate-400 text-sm">
                            {expanded ? "▲" : "▼"}
                        </span>
                    )}
                </div>
            </div>

            {/* Expanded events */}
            {expanded && day.events.length > 0 && (
                <div className="border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 space-y-2">
                    {day.events.map((event) => (
                        <div
                            key={event.id}
                            className="flex justify-between items-center text-sm"
                        >
                            <div className="flex items-center gap-2">
                                <Chip
                                    size="sm"
                                    color={
                                        event.type === "INCOME"
                                            ? "success"
                                            : event.type === "INVESTMENT"
                                                ? "primary"
                                                : "danger"
                                    }
                                    variant="flat"
                                >
                                    {event.type === "INCOME"
                                        ? "Receita"
                                        : event.type === "INVESTMENT"
                                            ? "Investimento"
                                            : "Despesa"}
                                </Chip>
                                <span className="text-slate-700 dark:text-slate-300">
                                    {event.description}
                                </span>
                                {event.status === "PLANNED" && (
                                    <Chip size="sm" variant="bordered" color="warning">
                                        Planejado
                                    </Chip>
                                )}
                            </div>
                            <span
                                className={`font-medium ${
                                    event.amount > 0 ? "text-green-600" : "text-red-600"
                                }`}
                            >
                                {event.amount > 0 ? "+" : ""}
                                {formatCurrency(event.amount)}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
