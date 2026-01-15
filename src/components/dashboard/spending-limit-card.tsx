"use client";

import { Card, CardBody, CardHeader, Chip } from "@nextui-org/react";
import type { SpendingLimitResult } from "@/lib/engines/spending-limit";
import { formatCurrency } from "@/types/finance";

interface SpendingLimitCardProps {
  spendingLimit: SpendingLimitResult;
}

export function SpendingLimitCard({ spendingLimit }: SpendingLimitCardProps) {
  const { breakdown, warnings } = spendingLimit;
  const {
    cashNow,
    requiredExpenses,
    plannedInvestments,
    safetyBuffer,
    availableForSpending,
    daysUntilHorizon,
    dailyLimit,
    isNegative,
    shortfallReason,
  } = breakdown;

  // Calculate percentages for breakdown visualization
  const total = cashNow;
  const expensePercent = total > 0 ? (requiredExpenses / total) * 100 : 0;
  const investmentPercent = total > 0 ? (plannedInvestments / total) * 100 : 0;
  const bufferPercent = total > 0 ? (safetyBuffer / total) * 100 : 0;
  const availablePercent = total > 0 ? Math.max(0, (availableForSpending / total) * 100) : 0;

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col items-start gap-2 pb-0">
        <div className="flex justify-between items-center w-full">
          <h2 className="text-xl font-semibold">Daily Spending Limit</h2>
          <Chip
            color={isNegative ? "danger" : dailyLimit < 2000 ? "warning" : "success"}
            variant="flat"
            size="sm"
          >
            {daysUntilHorizon} days until horizon
          </Chip>
        </div>
      </CardHeader>
      <CardBody className="gap-4">
        {/* Main limit display */}
        <div className="text-center py-4">
          <p className="text-sm text-gray-500 mb-1">You can safely spend</p>
          <p
            className={`text-5xl font-bold ${
              isNegative
                ? "text-red-500"
                : dailyLimit < 2000
                ? "text-yellow-500"
                : "text-green-500"
            }`}
          >
            {isNegative ? "$0" : formatCurrency(dailyLimit)}
          </p>
          <p className="text-sm text-gray-500 mt-1">per day</p>
        </div>

        {/* Shortfall warning */}
        {isNegative && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-700 font-medium">Shortfall Detected</p>
            <p className="text-sm text-red-600">
              {shortfallReason === "expenses" &&
                "Your required expenses exceed your available cash."}
              {shortfallReason === "investments" &&
                "Your planned investments exceed what's left after expenses."}
              {shortfallReason === "buffer" &&
                "After expenses and investments, you can't maintain your safety buffer."}
              {shortfallReason === "multiple" &&
                "Multiple factors are contributing to the shortfall."}
            </p>
          </div>
        )}

        {/* Breakdown */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Breakdown</h3>

          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Available Cash</span>
            <span className="font-medium">{formatCurrency(cashNow)}</span>
          </div>

          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Required Expenses</span>
            <span className="font-medium text-red-600">
              -{formatCurrency(requiredExpenses)}
            </span>
          </div>

          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Planned Investments</span>
            <span className="font-medium text-blue-600">
              -{formatCurrency(plannedInvestments)}
            </span>
          </div>

          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Safety Buffer</span>
            <span className="font-medium text-gray-500">
              -{formatCurrency(safetyBuffer)}
            </span>
          </div>

          <div className="border-t pt-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-700 font-medium">Available for Spending</span>
              <span
                className={`font-bold ${
                  availableForSpending < 0 ? "text-red-600" : "text-green-600"
                }`}
              >
                {formatCurrency(availableForSpending)}
              </span>
            </div>
          </div>
        </div>

        {/* Breakdown bar */}
        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden flex">
          <div
            className="bg-red-400 h-full"
            style={{ width: `${expensePercent}%` }}
            title="Expenses"
          />
          <div
            className="bg-blue-400 h-full"
            style={{ width: `${investmentPercent}%` }}
            title="Investments"
          />
          <div
            className="bg-gray-400 h-full"
            style={{ width: `${bufferPercent}%` }}
            title="Safety Buffer"
          />
          <div
            className="bg-green-400 h-full"
            style={{ width: `${availablePercent}%` }}
            title="Available"
          />
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-red-400 rounded-full" /> Expenses
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-blue-400 rounded-full" /> Investments
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-gray-400 rounded-full" /> Buffer
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-green-400 rounded-full" /> Available
          </span>
        </div>

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="space-y-2">
            {warnings.map((warning, index) => (
              <div
                key={index}
                className="bg-yellow-50 border border-yellow-200 rounded-lg p-2"
              >
                <p className="text-xs text-yellow-700">{warning}</p>
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
