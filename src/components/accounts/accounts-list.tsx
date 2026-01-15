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
  getAccountBalances,
  createAccount,
  deleteAccount,
  type AccountWithBalance,
  type CreateAccountInput,
} from "@/features/accounts";
import { formatCurrency } from "@/types/finance";
import { toast } from "react-toastify";

export function AccountsList() {
  const [accounts, setAccounts] = useState<AccountWithBalance[]>([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "BANK" as "BANK" | "CASH" | "INVESTMENT",
    initialBalance: "",
  });

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    setLoading(true);
    setError(null);

    const result = await getAccountBalances();

    if (result.success) {
      setAccounts(result.accounts);
      setTotalBalance(result.totalBalance);
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  const handleCreate = async () => {
    if (!formData.name) {
      toast.error("Account name is required");
      return;
    }

    setFormLoading(true);

    const input: CreateAccountInput = {
      name: formData.name,
      type: formData.type,
      initialBalance: parseFloat(formData.initialBalance) || 0,
    };

    const result = await createAccount(input);

    if (result.success) {
      toast.success("Account created");
      loadAccounts();
      onClose();
      setFormData({ name: "", type: "BANK", initialBalance: "" });
    } else {
      toast.error(result.error);
    }

    setFormLoading(false);
  };

  const handleDelete = async (accountId: string) => {
    if (!confirm("Are you sure you want to delete this account?")) return;

    const result = await deleteAccount(accountId);
    if (result.success) {
      toast.success("Account deleted");
      loadAccounts();
    } else {
      toast.error(result.error);
    }
  };

  const typeColors: Record<string, "primary" | "secondary" | "success"> = {
    BANK: "primary",
    CASH: "secondary",
    INVESTMENT: "success",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" label="Loading accounts..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Accounts</h1>
          <p className="text-gray-500">Manage your financial accounts</p>
        </div>
        <Button color="primary" onPress={onOpen}>
          Add Account
        </Button>
      </div>

      {/* Total balance */}
      <Card>
        <CardBody className="flex flex-row justify-between items-center">
          <span className="text-lg text-gray-600">Total Balance</span>
          <span
            className={`text-3xl font-bold ${
              totalBalance < 0 ? "text-red-600" : "text-green-600"
            }`}
          >
            {formatCurrency(totalBalance)}
          </span>
        </CardBody>
      </Card>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
          <Button color="primary" size="sm" className="mt-2" onPress={loadAccounts}>
            Retry
          </Button>
        </div>
      )}

      {/* Empty state */}
      {!error && accounts.length === 0 && (
        <Card>
          <CardBody className="text-center py-8">
            <p className="text-gray-500">No accounts yet.</p>
            <Button color="primary" className="mt-4" onPress={onOpen}>
              Create your first account
            </Button>
          </CardBody>
        </Card>
      )}

      {/* Accounts list */}
      {!error && accounts.length > 0 && (
        <div className="grid gap-4">
          {accounts.map((account) => (
            <Card key={account.id}>
              <CardBody className="flex flex-row justify-between items-center">
                <div className="flex items-center gap-4">
                  <Chip color={typeColors[account.type]} variant="flat">
                    {account.type}
                  </Chip>
                  <div>
                    <p className="font-semibold text-lg">{account.name}</p>
                    <p className="text-sm text-gray-500">
                      Initial: {formatCurrency(account.initialBalance)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span
                    className={`text-2xl font-bold ${
                      account.currentBalance < 0 ? "text-red-600" : ""
                    }`}
                  >
                    {formatCurrency(account.currentBalance)}
                  </span>
                  <Dropdown>
                    <DropdownTrigger>
                      <Button isIconOnly variant="light" size="sm">
                        ...
                      </Button>
                    </DropdownTrigger>
                    <DropdownMenu>
                      <DropdownItem
                        key="delete"
                        className="text-danger"
                        color="danger"
                        onPress={() => handleDelete(account.id)}
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

      {/* Create account modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <ModalHeader>Create New Account</ModalHeader>
          <ModalBody className="gap-4">
            <Input
              label="Account Name"
              placeholder="e.g., Main Checking"
              value={formData.name}
              onValueChange={(value) => setFormData({ ...formData, name: value })}
              isRequired
            />

            <Select
              label="Account Type"
              selectedKeys={[formData.type]}
              onSelectionChange={(keys) => {
                const value = Array.from(keys)[0] as "BANK" | "CASH" | "INVESTMENT";
                setFormData({ ...formData, type: value });
              }}
            >
              <SelectItem key="BANK">Bank Account</SelectItem>
              <SelectItem key="CASH">Cash</SelectItem>
              <SelectItem key="INVESTMENT">Investment Account</SelectItem>
            </Select>

            <Input
              label="Initial Balance"
              type="number"
              placeholder="0.00"
              startContent={<span className="text-gray-500">$</span>}
              value={formData.initialBalance}
              onValueChange={(value) =>
                setFormData({ ...formData, initialBalance: value })
              }
              description="Current balance in this account"
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={onClose}>
              Cancel
            </Button>
            <Button color="primary" onPress={handleCreate} isLoading={formLoading}>
              Create Account
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
