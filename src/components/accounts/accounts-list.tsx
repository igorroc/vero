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
    deleteAccount,
    type AccountWithBalance,
    type CreateAccountInput,
} from "@/features/accounts";
import {formatCurrency} from "@/types/finance";
import {toast} from "react-toastify";
import {Plus, MoreVertical, PiggyBank, Wallet} from "lucide-react";
import {StatCard} from "@/components/ui/stat-card";

export function AccountsList() {
    const [accounts, setAccounts] = useState<AccountWithBalance[]>([]);
    const [totalBalance, setTotalBalance] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const {isOpen, onOpen, onClose} = useDisclosure();
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
                    {accounts.map((account) => (
                        <div key={account.id} className="modern-card p-4">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                        <PiggyBank className="w-6 h-6 text-white"/>
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
                                        <DropdownMenu>
                                            <DropdownItem
                                                key="delete"
                                                className="text-danger"
                                                color="danger"
                                                onPress={() => handleDelete(account.id)}
                                            >
                                                Excluir
                                            </DropdownItem>
                                        </DropdownMenu>
                                    </Dropdown>
                                </div>
                            </div>
                        </div>
                    ))}
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
        </div>
    );
}
