"use client";

import {useEffect, useState} from "react";
import {
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
    updateAccount,
    deleteAccount,
    type AccountWithBalance,
    type CreateAccountInput,
    type UpdateAccountInput,
} from "@/features/accounts";
import {createWithdrawal, type CreateWithdrawalInput} from "@/features/events";
import {formatCurrency, centsToDollars} from "@/types/finance";
import {toast} from "react-toastify";
import {Plus, MoreVertical, PiggyBank, Wallet, Landmark, Banknote, TrendingUp, Pencil, ArrowDownToLine} from "lucide-react";
import {StatCard} from "@/components/ui/stat-card";

export function AccountsList() {
    const [accounts, setAccounts] = useState<AccountWithBalance[]>([]);
    const [totalBalance, setTotalBalance] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const {isOpen, onOpen, onClose} = useDisclosure();
    const {isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose} = useDisclosure();
    const [formLoading, setFormLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        type: "BANK" as "BANK" | "CASH" | "INVESTMENT",
        initialBalance: "",
    });
    const [editData, setEditData] = useState<{
        id: string;
        name: string;
        type: "BANK" | "CASH" | "INVESTMENT";
        initialBalance: string;
    } | null>(null);

    // Withdrawal (Resgate) state
    const {isOpen: isWithdrawalOpen, onOpen: onWithdrawalOpen, onClose: onWithdrawalClose} = useDisclosure();
    const [withdrawalData, setWithdrawalData] = useState<{
        fromAccountId: string;
        fromAccountName: string;
        toAccountId: string;
        amount: string;
        description: string;
        date: string;
    } | null>(null);

    // Get icon based on account type
    const getAccountIcon = (type: string) => {
        switch (type) {
            case "BANK":
                return Landmark;
            case "CASH":
                return Banknote;
            case "INVESTMENT":
                return TrendingUp;
            default:
                return PiggyBank;
        }
    };

    // Get gradient based on account type
    const getAccountGradient = (type: string) => {
        switch (type) {
            case "BANK":
                return "from-blue-500 to-blue-600";
            case "CASH":
                return "from-green-500 to-emerald-600";
            case "INVESTMENT":
                return "from-purple-500 to-violet-600";
            default:
                return "from-slate-500 to-slate-600";
        }
    };

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
            toast.error("Nome da conta é obrigatório");
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
            toast.success("Conta criada com sucesso");
            loadAccounts();
            onClose();
            setFormData({name: "", type: "BANK", initialBalance: ""});
        } else {
            toast.error(result.error);
        }

        setFormLoading(false);
    };

    const handleDelete = async (accountId: string) => {
        if (!confirm("Tem certeza que deseja excluir esta conta?")) return;

        const result = await deleteAccount(accountId);
        if (result.success) {
            toast.success("Conta excluída");
            loadAccounts();
        } else {
            toast.error(result.error);
        }
    };

    const handleEdit = (account: AccountWithBalance) => {
        setEditData({
            id: account.id,
            name: account.name,
            type: account.type,
            initialBalance: centsToDollars(account.initialBalance).toString(),
        });
        onEditOpen();
    };

    const handleUpdate = async () => {
        if (!editData) return;

        if (!editData.name) {
            toast.error("Nome da conta é obrigatório");
            return;
        }

        setFormLoading(true);

        const input: UpdateAccountInput = {
            id: editData.id,
            name: editData.name,
            type: editData.type,
            initialBalance: parseFloat(editData.initialBalance) || 0,
        };

        const result = await updateAccount(input);

        if (result.success) {
            toast.success("Conta atualizada com sucesso");
            loadAccounts();
            onEditClose();
            setEditData(null);
        } else {
            toast.error(result.error);
        }

        setFormLoading(false);
    };

    const handleWithdrawal = (account: AccountWithBalance) => {
        // Get the first non-investment account as default destination
        const defaultDestination = accounts.find(a => a.type !== "INVESTMENT");

        setWithdrawalData({
            fromAccountId: account.id,
            fromAccountName: account.name,
            toAccountId: defaultDestination?.id || "",
            amount: "",
            description: "",
            date: new Date().toISOString().split("T")[0],
        });
        onWithdrawalOpen();
    };

    const handleWithdrawalSubmit = async () => {
        if (!withdrawalData) return;

        if (!withdrawalData.toAccountId) {
            toast.error("Selecione uma conta de destino");
            return;
        }

        if (!withdrawalData.amount || parseFloat(withdrawalData.amount) <= 0) {
            toast.error("O valor deve ser maior que zero");
            return;
        }

        setFormLoading(true);

        const input: CreateWithdrawalInput = {
            fromAccountId: withdrawalData.fromAccountId,
            toAccountId: withdrawalData.toAccountId,
            amount: parseFloat(withdrawalData.amount),
            description: withdrawalData.description || undefined,
            date: new Date(withdrawalData.date),
        };

        const result = await createWithdrawal(input);

        if (result.success) {
            toast.success("Resgate realizado com sucesso");
            loadAccounts();
            onWithdrawalClose();
            setWithdrawalData(null);
        } else {
            toast.error(result.error);
        }

        setFormLoading(false);
    };

    // Get non-investment accounts for withdrawal destination
    const nonInvestmentAccounts = accounts.filter(a => a.type !== "INVESTMENT");

    const typeColors: Record<string, "primary" | "secondary" | "success"> = {
        BANK: "primary",
        CASH: "secondary",
        INVESTMENT: "success",
    };

    const typeLabels: Record<string, string> = {
        BANK: "Banco",
        CASH: "Dinheiro",
        INVESTMENT: "Investimento",
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Spinner size="lg" label="Carregando contas..."/>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Total balance card */}
            <StatCard
                title="Saldo Total"
                value={formatCurrency(totalBalance)}
                subtitle={`${accounts.length} conta(s) cadastrada(s)`}
                icon={Wallet}
                gradient={totalBalance >= 0 ? "blue" : "red"}
            />

            {/* Header */}
            <div className="flex justify-end">
                <Button
                    color="primary"
                    onPress={onOpen}
                    startContent={<Plus className="w-4 h-4"/>}
                >
                    Nova Conta
                </Button>
            </div>

            {/* Error state */}
            {error && (
                <div className="modern-card p-5 border-l-4 border-l-red-500">
                    <p className="text-red-600">{error}</p>
                    <Button color="primary" size="sm" className="mt-2" onPress={loadAccounts}>
                        Tentar Novamente
                    </Button>
                </div>
            )}

            {/* Empty state */}
            {!error && accounts.length === 0 && (
                <div className="modern-card p-12 text-center">
                    <PiggyBank className="w-12 h-12 text-slate-300 mx-auto mb-3"/>
                    <p className="text-slate-500">Nenhuma conta cadastrada.</p>
                    <Button color="primary" className="mt-4" onPress={onOpen}>
                        Criar sua primeira conta
                    </Button>
                </div>
            )}

            {/* Accounts list */}
            {!error && accounts.length > 0 && (
                <div className="grid gap-4">
                    {accounts.map((account) => {
                        const AccountIcon = getAccountIcon(account.type);
                        return (
                            <div key={account.id} className="modern-card p-4">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getAccountGradient(account.type)} flex items-center justify-center`}>
                                            <AccountIcon className="w-6 h-6 text-white"/>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <Chip color={typeColors[account.type]} variant="flat" size="sm">
                                                    {typeLabels[account.type]}
                                                </Chip>
                                            </div>
                                            <p className="font-semibold text-lg text-slate-900 dark:text-white">
                                                {account.name}
                                            </p>
                                            <p className="text-sm text-slate-500">
                                                Saldo inicial: {formatCurrency(account.initialBalance)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span
                                            className={`text-2xl font-bold ${
                                                account.currentBalance < 0
                                                    ? "text-red-600"
                                                    : "text-slate-900 dark:text-white"
                                            }`}
                                        >
                                            {formatCurrency(account.currentBalance)}
                                        </span>
                                        <Dropdown>
                                            <DropdownTrigger>
                                                <Button isIconOnly variant="light" size="sm">
                                                    <MoreVertical className="w-4 h-4"/>
                                                </Button>
                                            </DropdownTrigger>
                                            <DropdownMenu
                                                aria-label="Ações da conta"
                                                onAction={(key) => {
                                                    if (key === "edit") handleEdit(account);
                                                    if (key === "withdrawal") handleWithdrawal(account);
                                                    if (key === "delete") handleDelete(account.id);
                                                }}
                                            >
                                                <DropdownItem
                                                    key="edit"
                                                    startContent={<Pencil className="w-4 h-4"/>}
                                                >
                                                    Editar
                                                </DropdownItem>
                                                {account.type === "INVESTMENT" && nonInvestmentAccounts.length > 0 ? (
                                                    <DropdownItem
                                                        key="withdrawal"
                                                        startContent={<ArrowDownToLine className="w-4 h-4"/>}
                                                    >
                                                        Resgatar
                                                    </DropdownItem>
                                                ) : null}
                                                <DropdownItem
                                                    key="delete"
                                                    className="text-danger"
                                                    color="danger"
                                                >
                                                    Excluir
                                                </DropdownItem>
                                            </DropdownMenu>
                                        </Dropdown>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Create account modal */}
            <Modal isOpen={isOpen} onClose={onClose}>
                <ModalContent>
                    <ModalHeader>Nova Conta</ModalHeader>
                    <ModalBody className="gap-4">
                        <Input
                            label="Nome da Conta"
                            placeholder="Ex: Conta Corrente Principal"
                            value={formData.name}
                            onValueChange={(value) => setFormData({...formData, name: value})}
                            isRequired
                        />

                        <Select
                            label="Tipo de Conta"
                            selectedKeys={[formData.type]}
                            onSelectionChange={(keys) => {
                                const value = Array.from(keys)[0] as "BANK" | "CASH" | "INVESTMENT";
                                setFormData({...formData, type: value});
                            }}
                        >
                            <SelectItem key="BANK">Conta Bancária</SelectItem>
                            <SelectItem key="CASH">Dinheiro em Espécie</SelectItem>
                            <SelectItem key="INVESTMENT">Conta de Investimento</SelectItem>
                        </Select>

                        <Input
                            label="Saldo Inicial"
                            type="number"
                            placeholder="0,00"
                            startContent={<span className="text-gray-500">R$</span>}
                            value={formData.initialBalance}
                            onValueChange={(value) =>
                                setFormData({...formData, initialBalance: value})
                            }
                            description="Saldo atual nesta conta"
                        />
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" onPress={onClose}>
                            Cancelar
                        </Button>
                        <Button color="primary" onPress={handleCreate} isLoading={formLoading}>
                            Criar Conta
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Edit account modal */}
            <Modal isOpen={isEditOpen} onClose={onEditClose}>
                <ModalContent>
                    <ModalHeader>Editar Conta</ModalHeader>
                    <ModalBody className="gap-4">
                        <Input
                            label="Nome da Conta"
                            placeholder="Ex: Conta Corrente Principal"
                            value={editData?.name || ""}
                            onValueChange={(value) => setEditData(prev => prev ? {...prev, name: value} : null)}
                            isRequired
                        />

                        <Select
                            label="Tipo de Conta"
                            selectedKeys={editData?.type ? [editData.type] : []}
                            onSelectionChange={(keys) => {
                                const value = Array.from(keys)[0] as "BANK" | "CASH" | "INVESTMENT";
                                setEditData(prev => prev ? {...prev, type: value} : null);
                            }}
                        >
                            <SelectItem key="BANK">Conta Bancária</SelectItem>
                            <SelectItem key="CASH">Dinheiro em Espécie</SelectItem>
                            <SelectItem key="INVESTMENT">Conta de Investimento</SelectItem>
                        </Select>

                        <Input
                            label="Saldo Inicial"
                            type="number"
                            placeholder="0,00"
                            startContent={<span className="text-gray-500">R$</span>}
                            value={editData?.initialBalance || ""}
                            onValueChange={(value) =>
                                setEditData(prev => prev ? {...prev, initialBalance: value} : null)
                            }
                            description="Saldo inicial nesta conta (ajusta o saldo atual proporcionalmente)"
                        />
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" onPress={onEditClose}>
                            Cancelar
                        </Button>
                        <Button color="primary" onPress={handleUpdate} isLoading={formLoading}>
                            Salvar Alterações
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Withdrawal (Resgate) modal */}
            <Modal isOpen={isWithdrawalOpen} onClose={onWithdrawalClose}>
                <ModalContent>
                    <ModalHeader>
                        <div className="flex items-center gap-2">
                            <ArrowDownToLine className="w-5 h-5 text-purple-600"/>
                            <span>Resgatar Investimento</span>
                        </div>
                    </ModalHeader>
                    <ModalBody className="gap-4">
                        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
                            <p className="text-sm text-purple-700 dark:text-purple-300">
                                Resgatando de: <strong>{withdrawalData?.fromAccountName}</strong>
                            </p>
                        </div>

                        <Select
                            label="Conta de Destino"
                            placeholder="Selecione a conta para receber o resgate"
                            selectedKeys={withdrawalData?.toAccountId ? [withdrawalData.toAccountId] : []}
                            onSelectionChange={(keys) => {
                                const value = Array.from(keys)[0] as string;
                                setWithdrawalData(prev => prev ? {...prev, toAccountId: value} : null);
                            }}
                            isRequired
                        >
                            {nonInvestmentAccounts.map((account) => (
                                <SelectItem key={account.id} textValue={account.name}>
                                    <div className="flex justify-between items-center w-full">
                                        <span>{account.name}</span>
                                        <span className="text-xs text-slate-500">
                                            {account.type === "BANK" ? "Banco" : "Dinheiro"}
                                        </span>
                                    </div>
                                </SelectItem>
                            ))}
                        </Select>

                        <Input
                            label="Valor do Resgate"
                            type="number"
                            placeholder="0,00"
                            startContent={<span className="text-gray-500">R$</span>}
                            value={withdrawalData?.amount || ""}
                            onValueChange={(value) =>
                                setWithdrawalData(prev => prev ? {...prev, amount: value} : null)
                            }
                            isRequired
                        />

                        <Input
                            label="Descrição (opcional)"
                            placeholder="Ex: Resgate para emergência"
                            value={withdrawalData?.description || ""}
                            onValueChange={(value) =>
                                setWithdrawalData(prev => prev ? {...prev, description: value} : null)
                            }
                        />

                        <Input
                            label="Data"
                            type="date"
                            value={withdrawalData?.date || ""}
                            onValueChange={(value) =>
                                setWithdrawalData(prev => prev ? {...prev, date: value} : null)
                            }
                            isRequired
                        />
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" onPress={onWithdrawalClose}>
                            Cancelar
                        </Button>
                        <Button
                            color="secondary"
                            onPress={handleWithdrawalSubmit}
                            isLoading={formLoading}
                            startContent={<ArrowDownToLine className="w-4 h-4"/>}
                        >
                            Resgatar
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </div>
    );
}
