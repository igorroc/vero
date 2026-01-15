"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardBody,
  Button,
  Chip,
  Spinner,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Select,
  SelectItem,
  useDisclosure,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@nextui-org/react";
import {
  getInvestmentPlans,
  createInvestmentPlan,
  deleteInvestmentPlan,
  updateInvestmentPlan,
  getMonthlyInvestmentAmount,
  type CreateInvestmentPlanInput,
} from "@/features/investments";
import { getAccountBalances, type AccountWithBalance } from "@/features/accounts";
import { formatCurrency, centsToDollars } from "@/types/finance";
import type { InvestmentPlan } from "@prisma/client";
import { toast } from "react-toastify";

type InvestmentPlanWithAccount = InvestmentPlan & {
  account: { name: string; type: string };
};

export function InvestmentsList() {
  const [plans, setPlans] = useState<InvestmentPlanWithAccount[]>([]);
  const [accounts, setAccounts] = useState<AccountWithBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({
    accountId: "",
    name: "",
    amount: "",
    frequency: "MONTHLY" as "WEEKLY" | "BIWEEKLY" | "MONTHLY" | "YEARLY",
    dayOfExecution: "1",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    // Load accounts (investment accounts)
    const accountsResult = await getAccountBalances();
    if (accountsResult.success) {
      setAccounts(accountsResult.accounts.filter((a) => a.type === "INVESTMENT"));
      if (
        accountsResult.accounts.filter((a) => a.type === "INVESTMENT").length > 0 &&
        !formData.accountId
      ) {
        setFormData((prev) => ({
          ...prev,
          accountId: accountsResult.accounts.filter((a) => a.type === "INVESTMENT")[0]
            .id,
        }));
      }
    }

    // Load plans
    const plansResult = await getInvestmentPlans();
    if (plansResult.success) {
      setPlans(plansResult.plans as InvestmentPlanWithAccount[]);
    } else {
      setError(plansResult.error);
    }

    setLoading(false);
  };

  const handleCreate = async () => {
    if (!formData.accountId || !formData.name || !formData.amount) {
      toast.error("Please fill in all required fields");
      return;
    }

    setFormLoading(true);

    const input: CreateInvestmentPlanInput = {
      accountId: formData.accountId,
      name: formData.name,
      amount: parseFloat(formData.amount),
      frequency: formData.frequency,
      dayOfExecution: parseInt(formData.dayOfExecution),
      startDate: new Date(formData.startDate),
      endDate: formData.endDate ? new Date(formData.endDate) : null,
    };

    const result = await createInvestmentPlan(input);

    if (result.success) {
      toast.success("Investment plan created");
      loadData();
      onClose();
      setFormData({
        accountId: accounts[0]?.id || "",
        name: "",
        amount: "",
        frequency: "MONTHLY",
        dayOfExecution: "1",
        startDate: new Date().toISOString().split("T")[0],
        endDate: "",
      });
    } else {
      toast.error(result.error);
    }

    setFormLoading(false);
  };

  const handleToggleActive = async (plan: InvestmentPlan) => {
    const result = await updateInvestmentPlan({
      id: plan.id,
      isActive: !plan.isActive,
    });

    if (result.success) {
      toast.success(plan.isActive ? "Plan paused" : "Plan activated");
      loadData();
    } else {
      toast.error(result.error);
    }
  };

  const handleDelete = async (planId: string) => {
    if (!confirm("Are you sure you want to delete this investment plan?")) return;

    const result = await deleteInvestmentPlan(planId);
    if (result.success) {
      toast.success("Plan deleted");
      loadData();
    } else {
      toast.error(result.error);
    }
  };

  const getFrequencyLabel = (freq: string) => {
    switch (freq) {
      case "WEEKLY":
        return "Weekly";
      case "BIWEEKLY":
        return "Every 2 weeks";
      case "MONTHLY":
        return "Monthly";
      case "YEARLY":
        return "Yearly";
      default:
        return freq;
    }
  };

  // Calculate totals
  const totalMonthlyInvestment = plans
    .filter((p) => p.isActive)
    .reduce((sum, plan) => sum + getMonthlyInvestmentAmount(plan), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" label="Loading investment plans..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Investment Plans</h1>
          <p className="text-gray-500">Automate your wealth building</p>
        </div>
        <Button color="primary" onPress={onOpen} isDisabled={accounts.length === 0}>
          New Plan
        </Button>
      </div>

      {/* No investment accounts warning */}
      {accounts.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-700 font-medium">No Investment Accounts</p>
          <p className="text-sm text-yellow-600">
            Create an investment account first to set up investment plans.
          </p>
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardBody>
            <p className="text-sm text-gray-500">Active Plans</p>
            <p className="text-2xl font-bold">
              {plans.filter((p) => p.isActive).length}
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-gray-500">Monthly Investment</p>
            <p className="text-2xl font-bold text-blue-600">
              {formatCurrency(totalMonthlyInvestment)}
            </p>
          </CardBody>
        </Card>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
          <Button color="primary" size="sm" className="mt-2" onPress={loadData}>
            Retry
          </Button>
        </div>
      )}

      {/* Plans list */}
      {!error && plans.length === 0 && (
        <Card>
          <CardBody className="text-center py-8">
            <p className="text-gray-500">No investment plans yet.</p>
            {accounts.length > 0 && (
              <Button color="primary" className="mt-4" onPress={onOpen}>
                Create your first plan
              </Button>
            )}
          </CardBody>
        </Card>
      )}

      {!error && plans.length > 0 && (
        <div className="space-y-4">
          {plans.map((plan) => (
            <Card key={plan.id} className={!plan.isActive ? "opacity-60" : ""}>
              <CardBody className="flex flex-row justify-between items-center">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-lg">{plan.name}</span>
                    {!plan.isActive && (
                      <Chip size="sm" variant="flat">
                        Paused
                      </Chip>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>{plan.account.name}</span>
                    <span>|</span>
                    <span>{getFrequencyLabel(plan.frequency)}</span>
                    <span>|</span>
                    <span>Day {plan.dayOfExecution}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xl font-bold text-blue-600">
                      {formatCurrency(plan.amount)}
                    </p>
                    <p className="text-xs text-gray-500">per {plan.frequency.toLowerCase()}</p>
                  </div>
                  <Dropdown>
                    <DropdownTrigger>
                      <Button isIconOnly variant="light" size="sm">
                        ...
                      </Button>
                    </DropdownTrigger>
                    <DropdownMenu>
                      <DropdownItem
                        key="toggle"
                        onPress={() => handleToggleActive(plan)}
                      >
                        {plan.isActive ? "Pause" : "Activate"}
                      </DropdownItem>
                      <DropdownItem
                        key="delete"
                        className="text-danger"
                        color="danger"
                        onPress={() => handleDelete(plan.id)}
                      >
                        Delete
                      </DropdownItem>
                    </DropdownMenu>
                  </Dropdown>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Create plan modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalContent>
          <ModalHeader>Create Investment Plan</ModalHeader>
          <ModalBody className="gap-4">
            <Select
              label="Investment Account"
              selectedKeys={formData.accountId ? [formData.accountId] : []}
              onSelectionChange={(keys) => {
                const value = Array.from(keys)[0] as string;
                setFormData({ ...formData, accountId: value });
              }}
              isRequired
            >
              {accounts.map((account) => (
                <SelectItem key={account.id} textValue={account.name}>
                  {account.name}
                </SelectItem>
              ))}
            </Select>

            <Input
              label="Plan Name"
              placeholder="e.g., Emergency Fund"
              value={formData.name}
              onValueChange={(value) => setFormData({ ...formData, name: value })}
              isRequired
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Amount"
                type="number"
                placeholder="0.00"
                startContent={<span className="text-gray-500">$</span>}
                value={formData.amount}
                onValueChange={(value) => setFormData({ ...formData, amount: value })}
                isRequired
              />

              <Select
                label="Frequency"
                selectedKeys={[formData.frequency]}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0] as typeof formData.frequency;
                  setFormData({ ...formData, frequency: value });
                }}
              >
                <SelectItem key="WEEKLY">Weekly</SelectItem>
                <SelectItem key="BIWEEKLY">Every 2 weeks</SelectItem>
                <SelectItem key="MONTHLY">Monthly</SelectItem>
                <SelectItem key="YEARLY">Yearly</SelectItem>
              </Select>
            </div>

            <Input
              label="Day of Execution"
              type="number"
              min={1}
              max={31}
              placeholder="1"
              value={formData.dayOfExecution}
              onValueChange={(value) =>
                setFormData({ ...formData, dayOfExecution: value })
              }
              description="Day of the month (1-31) or day of week (1-7 for weekly)"
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Start Date"
                type="date"
                value={formData.startDate}
                onValueChange={(value) =>
                  setFormData({ ...formData, startDate: value })
                }
                isRequired
              />

              <Input
                label="End Date (Optional)"
                type="date"
                value={formData.endDate}
                onValueChange={(value) => setFormData({ ...formData, endDate: value })}
                description="Leave empty for indefinite"
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={onClose}>
              Cancel
            </Button>
            <Button color="primary" onPress={handleCreate} isLoading={formLoading}>
              Create Plan
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
