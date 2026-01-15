"use client";

import {useEffect, useState} from "react";
import {
    Spinner,
    Button,
    Chip,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
} from "@nextui-org/react";
import {getCashflowProjection} from "@/features/cashflow";
import {formatCurrency, type CashflowProjection, type CashflowDay} from "@/types/finance";
import {
    TrendingUp,
    TrendingDown,
    PiggyBank,
    AlertTriangle,
    ChevronDown,
    ChevronRight,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    Wallet,
} from "lucide-react";

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

    const periodOptions = [
        {key: "30", label: "30 Dias"},
        {key: "60", label: "60 Dias"},
        {key: "90", label: "90 Dias"},
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Spinner size="lg" label="Carregando projeção..."/>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 px-4">
                <div className="bg-red-100 dark:bg-red-900/30 rounded-2xl p-6 text-center">
                    <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3"/>
                    <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
                </div>
                <Button
                    color="primary"
                    onPress={loadProjection}
                    className="rounded-xl"
                >
                    Tentar Novamente
                </Button>
            </div>
        );
    }

    if (!projection) {
        return null;
    }

    return (
        <div className="space-y-4 sm:space-y-6 max-w-4xl mx-auto">
            {/* Header Card with Net Change */}
            <div
                className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 rounded-2xl sm:rounded-3xl p-5 sm:p-6 text-white relative overflow-hidden">
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-32 h-32 pointer-events-none">
                    <div className="absolute top-4 right-4 w-12 h-12 bg-pink-500/40 rounded-full blur-sm"/>
                    <div className="absolute top-8 right-12 w-8 h-8 bg-yellow-400/60 rounded-full"/>
                </div>
                <div className="absolute bottom-0 left-0 w-24 h-24 pointer-events-none">
                    <div className="absolute bottom-4 left-4 w-16 h-16 bg-blue-400/30 rounded-full blur-md"/>
                </div>

                <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-white/70"/>
                            <span className="text-white/70 text-sm">Projeção de {days} dias</span>
                        </div>

                        {/* Period Selector - Dropdown on mobile, buttons on desktop */}
                        <div className="sm:hidden">
                            <Dropdown>
                                <DropdownTrigger>
                                    <Button
                                        variant="flat"
                                        size="sm"
                                        className="bg-white/20 text-white min-w-[100px] rounded-xl"
                                        endContent={<ChevronDown className="w-4 h-4"/>}
                                    >
                                        {days} Dias
                                    </Button>
                                </DropdownTrigger>
                                <DropdownMenu
                                    aria-label="Período"
                                    selectedKeys={[days.toString()]}
                                    onSelectionChange={(keys) => {
                                        const selected = Array.from(keys)[0] as string;
                                        setDays(parseInt(selected));
                                    }}
                                    selectionMode="single"
                                >
                                    {periodOptions.map((option) => (
                                        <DropdownItem key={option.key}>{option.label}</DropdownItem>
                                    ))}
                                </DropdownMenu>
                            </Dropdown>
                        </div>

                        <div className="hidden sm:flex gap-2">
                            {periodOptions.map((option) => (
                                <Button
                                    key={option.key}
                                    size="sm"
                                    className={`rounded-xl ${
                                        days === parseInt(option.key)
                                            ? "bg-white text-indigo-900 font-medium"
                                            : "bg-white/20 text-white hover:bg-white/30"
                                    }`}
                                    onPress={() => setDays(parseInt(option.key))}
                                >
                                    {option.label}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <p className="text-white/70 text-sm mb-1">Variação Líquida no Período</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl sm:text-4xl font-bold">
                            {projection.netChange >= 0 ? "+" : ""}{formatCurrency(projection.netChange)}
                        </span>
                        {projection.netChange >= 0 ? (
                            <ArrowUpRight className="w-6 h-6 text-emerald-400"/>
                        ) : (
                            <ArrowDownRight className="w-6 h-6 text-red-400"/>
                        )}
                    </div>
                </div>
            </div>

            {/* Summary Cards - Grid */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {/* Income Card */}
                <div className="bg-cyan-100 dark:bg-cyan-900/30 rounded-2xl p-4 sm:p-5">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-cyan-500/20 rounded-xl flex items-center justify-center">
                            <TrendingUp className="w-4 h-4 text-cyan-600 dark:text-cyan-400"/>
                        </div>
                        <span className="text-xs sm:text-sm text-cyan-700 dark:text-cyan-300">Receitas</span>
                    </div>
                    <p className="text-lg sm:text-xl font-bold text-cyan-900 dark:text-cyan-100">
                        {formatCurrency(projection.totalIncome)}
                    </p>
                </div>

                {/* Expense Card */}
                <div className="bg-pink-100 dark:bg-pink-900/30 rounded-2xl p-4 sm:p-5">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-pink-500/20 rounded-xl flex items-center justify-center">
                            <TrendingDown className="w-4 h-4 text-pink-600 dark:text-pink-400"/>
                        </div>
                        <span className="text-xs sm:text-sm text-pink-700 dark:text-pink-300">Despesas</span>
                    </div>
                    <p className="text-lg sm:text-xl font-bold text-pink-900 dark:text-pink-100">
                        {formatCurrency(projection.totalExpenses)}
                    </p>
                </div>

                {/* Investments Card */}
                <div className="bg-purple-100 dark:bg-purple-900/30 rounded-2xl p-4 sm:p-5">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-purple-500/20 rounded-xl flex items-center justify-center">
                            <PiggyBank className="w-4 h-4 text-purple-600 dark:text-purple-400"/>
                        </div>
                        <span className="text-xs sm:text-sm text-purple-700 dark:text-purple-300">Investimentos</span>
                    </div>
                    <p className="text-lg sm:text-xl font-bold text-purple-900 dark:text-purple-100">
                        {formatCurrency(projection.totalInvestments)}
                    </p>
                </div>

                {/* Balance Projection Card */}
                <div className="bg-amber-100 dark:bg-amber-900/30 rounded-2xl p-4 sm:p-5">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-amber-500/20 rounded-xl flex items-center justify-center">
                            <Wallet className="w-4 h-4 text-amber-600 dark:text-amber-400"/>
                        </div>
                        <span className="text-xs sm:text-sm text-amber-700 dark:text-amber-300">Saldo Final</span>
                    </div>
                    <p className="text-lg sm:text-xl font-bold text-amber-900 dark:text-amber-100">
                        {projection.days.length > 0
                            ? formatCurrency(projection.days[projection.days.length - 1].endingBalance)
                            : formatCurrency(0)}
                    </p>
                </div>
            </div>

            {/* Warnings */}
            {projection.negativeDays > 0 && (
                <div
                    className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-4 sm:p-5 border border-red-200 dark:border-red-800">
                    <div className="flex items-start gap-3">
                        <div
                            className="w-10 h-10 bg-red-100 dark:bg-red-800/50 rounded-xl flex items-center justify-center flex-shrink-0">
                            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400"/>
                        </div>
                        <div>
                            <h3 className="font-semibold text-red-900 dark:text-red-100 text-sm sm:text-base">
                                {projection.negativeDays} dia{projection.negativeDays > 1 ? "s" : ""} com saldo negativo
                            </h3>
                            {projection.lowestBalanceDate && (
                                <p className="text-xs sm:text-sm text-red-600 dark:text-red-400 mt-1">
                                    Menor saldo: {formatCurrency(projection.lowestBalance)} em{" "}
                                    {formatDate(projection.lowestBalanceDate)}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {projection.criticalDays > 0 && projection.negativeDays === 0 && (
                <div
                    className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-4 sm:p-5 border border-amber-200 dark:border-amber-800">
                    <div className="flex items-start gap-3">
                        <div
                            className="w-10 h-10 bg-amber-100 dark:bg-amber-800/50 rounded-xl flex items-center justify-center flex-shrink-0">
                            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400"/>
                        </div>
                        <div>
                            <h3 className="font-semibold text-amber-900 dark:text-amber-100 text-sm sm:text-base">
                                {projection.criticalDays} dia{projection.criticalDays > 1 ? "s" : ""} abaixo da reserva
                                de segurança
                            </h3>
                        </div>
                    </div>
                </div>
            )}

            {/* Timeline */}
            <div
                className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-800">
                <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">
                        Detalhamento Diário
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                        Toque em um dia para ver os eventos
                    </p>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
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

    return (
        <div
            className={`${
                day.isNegative
                    ? "bg-red-50/50 dark:bg-red-900/10"
                    : day.isCritical
                        ? "bg-amber-50/50 dark:bg-amber-900/10"
                        : isToday
                            ? "bg-indigo-50/50 dark:bg-indigo-900/10"
                            : ""
            }`}
        >
            {/* Main row */}
            <div
                className="flex justify-between items-center p-3 sm:p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors active:bg-slate-100 dark:active:bg-slate-800"
                onClick={() => day.events.length > 0 && setExpanded(!expanded)}
            >
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    {/* Date indicator */}
                    <div
                        className={`flex-shrink-0 w-10 sm:w-12 h-10 sm:h-12 rounded-xl flex flex-col items-center justify-center ${
                            isToday
                                ? "bg-indigo-600 text-white"
                                : day.isNegative
                                    ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                        }`}>
                        <span className="text-[10px] sm:text-xs uppercase font-medium leading-none">
                            {isToday ? "Hoje" : new Date(day.date).toLocaleDateString("pt-BR", {weekday: "short"}).replace(".", "")}
                        </span>
                        <span className="text-sm sm:text-lg font-bold leading-tight">
                            {new Date(day.date).getDate()}
                        </span>
                    </div>

                    {/* Events info */}
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                            {day.events.length > 0 && (
                                <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                                    {day.events.length} evento{day.events.length > 1 ? "s" : ""}
                                </span>
                            )}
                            {day.events.length === 0 && (
                                <span className="text-xs sm:text-sm text-slate-400 dark:text-slate-500">
                                    Sem eventos
                                </span>
                            )}
                            {day.isNegative && (
                                <Chip
                                    color="danger"
                                    size="sm"
                                    variant="flat"
                                    className="h-5 text-[10px] sm:text-xs"
                                >
                                    Negativo
                                </Chip>
                            )}
                            {day.isCritical && !day.isNegative && (
                                <Chip
                                    color="warning"
                                    size="sm"
                                    variant="flat"
                                    className="h-5 text-[10px] sm:text-xs"
                                >
                                    Baixo
                                </Chip>
                            )}
                        </div>
                        {day.netChange !== 0 && (
                            <span
                                className={`text-xs sm:text-sm font-medium ${
                                    day.netChange > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                                }`}
                            >
                                {day.netChange > 0 ? "+" : ""}
                                {formatCurrency(day.netChange)}
                            </span>
                        )}
                    </div>
                </div>

                {/* Balance and chevron */}
                <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                    <div className="text-right">
                        <p className="text-[10px] sm:text-xs text-slate-500 hidden sm:block">Saldo</p>
                        <span
                            className={`text-sm sm:text-base font-bold ${
                                day.endingBalance < 0
                                    ? "text-red-600 dark:text-red-400"
                                    : "text-slate-900 dark:text-white"
                            }`}
                        >
                            {formatCurrency(day.endingBalance)}
                        </span>
                    </div>
                    {day.events.length > 0 && (
                        <ChevronRight
                            className={`w-4 h-4 sm:w-5 sm:h-5 text-slate-400 transition-transform ${
                                expanded ? "rotate-90" : ""
                            }`}
                        />
                    )}
                </div>
            </div>

            {/* Expanded events */}
            {expanded && day.events.length > 0 && (
                <div
                    className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 px-3 sm:px-4 py-2 sm:py-3 space-y-2">
                    {day.events.map((event) => (
                        <div
                            key={event.id}
                            className="flex justify-between items-start sm:items-center gap-2 py-1.5"
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                        event.type === "INCOME"
                                            ? "bg-emerald-500"
                                            : event.type === "INVESTMENT"
                                                ? "bg-purple-500"
                                                : "bg-red-500"
                                    }`}/>
                                    <Chip
                                        size="sm"
                                        variant="flat"
                                        className={`h-5 text-[10px] sm:text-xs ${
                                            event.type === "INCOME"
                                                ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                                                : event.type === "INVESTMENT"
                                                    ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                                                    : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                                        }`}
                                    >
                                        {event.type === "INCOME"
                                            ? "Receita"
                                            : event.type === "INVESTMENT"
                                                ? "Invest."
                                                : "Despesa"}
                                    </Chip>
                                </div>
                                <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 truncate">
                                    {event.description}
                                </span>
                                {event.status === "PLANNED" && (
                                    <Chip
                                        size="sm"
                                        variant="bordered"
                                        className="h-5 text-[10px] sm:text-xs border-amber-300 text-amber-600 dark:text-amber-400"
                                    >
                                        Planejado
                                    </Chip>
                                )}
                            </div>
                            <span
                                className={`text-xs sm:text-sm font-semibold flex-shrink-0 ${
                                    event.amount > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
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
