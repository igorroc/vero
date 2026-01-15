"use client";

import {useEffect, useState} from "react";
import {Spinner, Button} from "@nextui-org/react";
import Link from "next/link";
import {getDashboardData, type DashboardData} from "@/features/dashboard";
import {SpendingLimitCard} from "./spending-limit-card";
import {AccountsSummary} from "./accounts-summary";
import {UpcomingEvents} from "./upcoming-events";
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
                <Spinner size="lg" label="Loading dashboard..."/>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <p className="text-red-500">{error}</p>
                <Button color="primary" onPress={loadDashboard}>
                    Retry
                </Button>
            </div>
        );
    }

    if (!data) {
        return null;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Financial Dashboard</h1>
                    <p className="text-gray-500">Your financial copilot</p>
                </div>
                <div className="flex gap-2">
                    <Button as={Link} href="/events" color="primary" variant="flat">
                        Manage Events
                    </Button>
                    <Button as={Link} href="/accounts" color="default" variant="flat">
                        Manage Accounts
                    </Button>
                </div>
            </div>

            {/* Main grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left column - Spending limit */}
                <div className="space-y-6">
                    <SpendingLimitCard spendingLimit={data.spendingLimit}/>

                    {/* Quick projection summary */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white rounded-lg p-4 shadow-sm border">
                            <p className="text-sm text-gray-500">30-Day Projection</p>
                            <p
                                className={`text-2xl font-bold ${
                                    data.projectionSummary.netChange >= 0
                                        ? "text-green-600"
                                        : "text-red-600"
                                }`}
                            >
                                {data.projectionSummary.netChange >= 0 ? "+" : ""}
                                {formatCurrency(data.projectionSummary.netChange)}
                            </p>
                        </div>
                        <div className="bg-white rounded-lg p-4 shadow-sm border">
                            <p className="text-sm text-gray-500">Avg Daily Spend</p>
                            <p className="text-2xl font-bold text-gray-700">
                                {formatCurrency(data.projectionSummary.avgDailySpend)}
                            </p>
                        </div>
                    </div>

                    {/* Critical events warning */}
                    {data.criticalEvents.length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <h3 className="font-semibold text-red-700 mb-2">
                                Critical Events Detected
                            </h3>
                            <p className="text-sm text-red-600 mb-3">
                                The following events may cause your balance to go negative:
                            </p>
                            <ul className="space-y-2">
                                {data.criticalEvents.map((event, index) => (
                                    <li key={index} className="text-sm text-red-700">
                                        {event.description}: {formatCurrency(event.amount)}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Days until negative warning */}
                    {data.projectionSummary.daysUntilNegative !== null && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <h3 className="font-semibold text-yellow-700">Balance Warning</h3>
                            <p className="text-sm text-yellow-600">
                                Your balance is projected to go negative in{" "}
                                <strong>{data.projectionSummary.daysUntilNegative} days</strong>.
                                Consider reviewing your upcoming expenses.
                            </p>
                        </div>
                    )}
                </div>

                {/* Right column - Accounts and Events */}
                <div className="space-y-6">
                    <AccountsSummary
                        accounts={data.accounts}
                        totalBalance={data.totalBalance}
                    />
                    <UpcomingEvents events={data.upcomingEvents}/>
                </div>
            </div>

            {/* Quick links */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                <Button
                    as={Link}
                    href="/cashflow"
                    color="default"
                    variant="bordered"
                    className="h-auto py-4"
                >
                    <div className="text-left">
                        <p className="font-semibold">Cashflow Timeline</p>
                        <p className="text-sm text-gray-500">View day-by-day projection</p>
                    </div>
                </Button>
                <Button
                    as={Link}
                    href="/investments"
                    color="default"
                    variant="bordered"
                    className="h-auto py-4"
                >
                    <div className="text-left">
                        <p className="font-semibold">Investment Plans</p>
                        <p className="text-sm text-gray-500">Track your investment goals</p>
                    </div>
                </Button>
                <Button
                    as={Link}
                    href="/settings"
                    color="default"
                    variant="bordered"
                    className="h-auto py-4"
                >
                    <div className="text-left">
                        <p className="font-semibold">Settings</p>
                        <p className="text-sm text-gray-500">Configure horizon and buffer</p>
                    </div>
                </Button>
            </div>
        </div>
    );
}
