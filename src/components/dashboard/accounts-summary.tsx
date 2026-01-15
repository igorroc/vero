"use client";

import { Card, CardBody, CardHeader, Chip } from "@nextui-org/react";
import { formatCurrency, type Cents } from "@/types/finance";
import type { AccountWithBalance } from "@/features/accounts";

interface AccountsSummaryProps {
  accounts: AccountWithBalance[];
  totalBalance: Cents;
}

export function AccountsSummary({ accounts, totalBalance }: AccountsSummaryProps) {
  const accountTypeColors: Record<string, "primary" | "secondary" | "success"> = {
    BANK: "primary",
    CASH: "secondary",
    INVESTMENT: "success",
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col items-start gap-2 pb-0">
        <div className="flex justify-between items-center w-full">
          <h2 className="text-xl font-semibold">Accounts</h2>
          <span className="text-2xl font-bold text-primary">
            {formatCurrency(totalBalance)}
          </span>
        </div>
      </CardHeader>
      <CardBody>
        {accounts.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            No accounts yet. Add your first account to get started.
          </p>
        ) : (
          <div className="space-y-3">
            {accounts.map((account) => (
              <div
                key={account.id}
                className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Chip
                    color={accountTypeColors[account.type] || "default"}
                    size="sm"
                    variant="flat"
                  >
                    {account.type}
                  </Chip>
                  <span className="font-medium">{account.name}</span>
                </div>
                <span
                  className={`font-semibold ${
                    account.currentBalance < 0 ? "text-red-500" : ""
                  }`}
                >
                  {formatCurrency(account.currentBalance)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
