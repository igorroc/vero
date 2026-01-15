"use client";

import {useEffect, useState} from "react";
import {
    Card,
    CardBody,
    CardHeader,
    Spinner,
    Button,
    Chip,
    ButtonGroup,
} from "@nextui-org/react";
import {getCashflowProjection} from "@/features/cashflow";
import {formatCurrency, type CashflowProjection, type CashflowDay} from "@/types/finance";

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
        return d.toLocaleDateString("en-US", {
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
                <Spinner size="lg" label="Loading projection..."/>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <p className="text-red-500">{error}</p>
                <Button color="primary" onPress={loadProjection}>
                    Retry
                </Button>
            </div>
        );
    }

    if (!projection) {
        return null;
    }

    return (
        <div className="space-y-6">
            {/* Controls */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Cashflow Timeline</h1>
                    <p className="text-gray-500">Day-by-day projection</p>
                </div>
                <ButtonGroup>
                    <Button
                        color={days === 30 ? "primary" : "default"}
                        variant={days === 30 ? "solid" : "bordered"}
                        onPress={() => setDays(30)}
                    >
                        30 Days
                    </Button>
                    <Button
                        color={days === 60 ? "primary" : "default"}
                        variant={days === 60 ? "solid" : "bordered"}
                        onPress={() => setDays(60)}
                    >
                        60 Days
                    </Button>
                    <Button
                        color={days === 90 ? "primary" : "default"}
                        variant={days === 90 ? "solid" : "bordered"}
                        onPress={() => setDays(90)}
                    >
                        90 Days
                    </Button>
                </ButtonGroup>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardBody className="py-3">
                        <p className="text-sm text-gray-500">Total Income</p>
                        <p className="text-xl font-bold text-green-600">
                            +{formatCurrency(projection.totalIncome)}
                        </p>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody className="py-3">
                        <p className="text-sm text-gray-500">Total Expenses</p>
                        <p className="text-xl font-bold text-red-600">
                            -{formatCurrency(projection.totalExpenses)}
                        </p>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody className="py-3">
                        <p className="text-sm text-gray-500">Investments</p>
                        <p className="text-xl font-bold text-blue-600">
                            -{formatCurrency(projection.totalInvestments)}
                        </p>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody className="py-3">
                        <p className="text-sm text-gray-500">Net Change</p>
                        <p
                            className={`text-xl font-bold ${
                                projection.netChange >= 0 ? "text-green-600" : "text-red-600"
                            }`}
                        >
                            {projection.netChange >= 0 ? "+" : ""}
                            {formatCurrency(projection.netChange)}
                        </p>
                    </CardBody>
                </Card>
            </div>

            {/* Warnings */}
            {projection.negativeDays > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="font-semibold text-red-700">
                        Warning: {projection.negativeDays} day(s) with negative balance
                    </p>
                    {projection.lowestBalanceDate && (
                        <p className="text-sm text-red-600">
                            Lowest balance: {formatCurrency(projection.lowestBalance)} on{" "}
                            {formatDate(projection.lowestBalanceDate)}
                        </p>
                    )}
                </div>
            )}

            {projection.criticalDays > 0 && projection.negativeDays === 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="font-semibold text-yellow-700">
                        Warning: {projection.criticalDays} day(s) below safety buffer
                    </p>
                </div>
            )}

            {/* Timeline */}
            <Card>
                <CardHeader>
                    <h2 className="text-xl font-semibold">Daily Breakdown</h2>
                </CardHeader>
                <CardBody>
                    <div className="space-y-2">
                        {projection.days.map((day) => (
                            <DayRow key={day.dateKey} day={day} isToday={isToday(day.date)}/>
                        ))}
                    </div>
                </CardBody>
            </Card>
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
        return d.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
        });
    };

    return (
        <div
            className={`border rounded-lg overflow-hidden ${
                day.isNegative
                    ? "border-red-300 bg-red-50"
                    : day.isCritical
                        ? "border-yellow-300 bg-yellow-50"
                        : isToday
                            ? "border-blue-300 bg-blue-50"
                            : "border-gray-200"
            }`}
        >
            {/* Main row */}
            <div
                className="flex justify-between items-center p-3 cursor-pointer hover:bg-gray-50"
                onClick={() => day.events.length > 0 && setExpanded(!expanded)}
            >
                <div className="flex items-center gap-3">
          <span
              className={`font-medium ${isToday ? "text-blue-600" : ""}`}
          >
            {isToday ? "Today" : formatDate(day.date)}
          </span>
                    {day.events.length > 0 && (
                        <Chip size="sm" variant="flat">
                            {day.events.length} event{day.events.length > 1 ? "s" : ""}
                        </Chip>
                    )}
                    {day.isNegative && (
                        <Chip color="danger" size="sm">
                            Negative
                        </Chip>
                    )}
                    {day.isCritical && !day.isNegative && (
                        <Chip color="warning" size="sm">
                            Low
                        </Chip>
                    )}
                </div>
                <div className="flex items-center gap-4">
                    {day.netChange !== 0 && (
                        <span
                            className={`text-sm ${
                                day.netChange > 0 ? "text-green-600" : "text-red-600"
                            }`}
                        >
              {day.netChange > 0 ? "+" : ""}
                            {formatCurrency(day.netChange)}
            </span>
                    )}
                    <span
                        className={`font-semibold ${
                            day.endingBalance < 0 ? "text-red-600" : ""
                        }`}
                    >
            {formatCurrency(day.endingBalance)}
          </span>
                    {day.events.length > 0 && (
                        <span className="text-gray-400">{expanded ? "▲" : "▼"}</span>
                    )}
                </div>
            </div>

            {/* Expanded events */}
            {expanded && day.events.length > 0 && (
                <div className="border-t bg-white p-3 space-y-2">
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
                                    {event.type}
                                </Chip>
                                <span>{event.description}</span>
                                {event.status === "PLANNED" && (
                                    <Chip size="sm" variant="bordered" color="warning">
                                        Planned
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
