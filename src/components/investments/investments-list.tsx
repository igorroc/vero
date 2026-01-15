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
    getInvestmentPlans,
    createInvestmentPlan,
    deleteInvestmentPlan,
    updateInvestmentPlan,
    getMonthlyInvestmentAmount,
    type CreateInvestmentPlanInput,
} from "@/features/investments";
import {getAccountBalances, type AccountWithBalance} from "@/features/accounts";
import {formatCurrency} from "@/types/finance";
import type {InvestmentPlan} from "@prisma/client";
import {toast} from "react-toastify";
import {Plus, MoreVertical, TrendingUp, PiggyBank, AlertTriangle} from "lucide-react";
import {StatCard} from "@/components/ui/stat-card";

type InvestmentPlanWithAccount = InvestmentPlan & {
    account: { name: string; type: string };
};

export function InvestmentsList() {
    const [plans, setPlans] = useState<InvestmentPlanWithAccount[]>([]);
    const [accounts, setAccounts] = useState<AccountWithBalance[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const {isOpen, onOpen, onClose} = useDisclosure();
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
            toast.error("Por favor, preencha todos os campos obrigatórios");
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
            toast.success("Plano de investimento criado");
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
            toast.success(plan.isActive ? "Plano pausado" : "Plano ativado");
            loadData();
        } else {
            toast.error(result.error);
        }
    };

    const handleDelete = async (planId: string) => {
        if (!confirm("Tem certeza que deseja excluir este plano de investimento?")) return;

        const result = await deleteInvestmentPlan(planId);
        if (result.success) {
            toast.success("Plano excluído");
            loadData();
        } else {
            toast.error(result.error);
        }
    };

    const getFrequencyLabel = (freq: string) => {
        switch (freq) {
            case "WEEKLY":
                return "Semanal";
            case "BIWEEKLY":
                return "Quinzenal";
            case "MONTHLY":
                return "Mensal";
            case "YEARLY":
                return "Anual";
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
                <Spinner size="lg" label="Carregando planos de investimento..."/>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <StatCard
                    title="Planos Ativos"
                    value={plans.filter((p) => p.isActive).length.toString()}
                    subtitle={`${plans.length} plano(s) total`}
                    icon={TrendingUp}
                    gradient="purple"
                />
                <StatCard
                    title="Investimento Mensal"
                    value={formatCurrency(totalMonthlyInvestment)}
                    subtitle="Total em planos ativos"
                    icon={PiggyBank}
                    gradient="blue"
                />
            </div>

            {/* No investment accounts warning */}
            {accounts.length === 0 && (
                <div className="modern-card p-5 border-l-4 border-l-yellow-500">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                            <AlertTriangle className="w-5 h-5 text-yellow-600"/>
                        </div>
                        <div>
                            <h3 className="font-semibold text-slate-900 dark:text-white">
                                Sem Contas de Investimento
                            </h3>
                            <p className="text-sm text-slate-500 mt-1">
                                Crie uma conta de investimento primeiro para configurar planos de investimento.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex justify-end">
                <Button
                    color="primary"
                    onPress={onOpen}
                    isDisabled={accounts.length === 0}
                    startContent={<Plus className="w-4 h-4"/>}
                >
                    Novo Plano
                </Button>
            </div>

            {/* Error state */}
            {error && (
                <div className="modern-card p-5 border-l-4 border-l-red-500">
                    <p className="text-red-600">{error}</p>
                    <Button color="primary" size="sm" className="mt-2" onPress={loadData}>
                        Tentar Novamente
                    </Button>
                </div>
            )}

            {/* Plans list */}
            {!error && plans.length === 0 && (
                <div className="modern-card p-12 text-center">
                    <TrendingUp className="w-12 h-12 text-slate-300 mx-auto mb-3"/>
                    <p className="text-slate-500">Nenhum plano de investimento ainda.</p>
                    {accounts.length > 0 && (
                        <Button color="primary" className="mt-4" onPress={onOpen}>
                            Criar seu primeiro plano
                        </Button>
                    )}
                </div>
            )}

            {!error && plans.length > 0 && (
                <div className="space-y-4">
                    {plans.map((plan) => (
                        <div
                            key={plan.id}
                            className={`modern-card p-4 ${!plan.isActive ? "opacity-60" : ""}`}
                        >
                            <div className="flex justify-between items-center">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-lg text-slate-900 dark:text-white">
                                            {plan.name}
                                        </span>
                                        {!plan.isActive && (
                                            <Chip size="sm" variant="flat">
                                                Pausado
                                            </Chip>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-500">
                                        <span>{plan.account.name}</span>
                                        <span>|</span>
                                        <span>{getFrequencyLabel(plan.frequency)}</span>
                                        <span>|</span>
                                        <span>Dia {plan.dayOfExecution}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <p className="text-xl font-bold text-purple-600">
                                            {formatCurrency(plan.amount)}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            por {getFrequencyLabel(plan.frequency).toLowerCase()}
                                        </p>
                                    </div>
                                    <Dropdown>
                                        <DropdownTrigger>
                                            <Button isIconOnly variant="light" size="sm">
                                                <MoreVertical className="w-4 h-4"/>
                                            </Button>
                                        </DropdownTrigger>
                                        <DropdownMenu>
                                            <DropdownItem
                                                key="toggle"
                                                onPress={() => handleToggleActive(plan)}
                                            >
                                                {plan.isActive ? "Pausar" : "Ativar"}
                                            </DropdownItem>
                                            <DropdownItem
                                                key="delete"
                                                className="text-danger"
                                                color="danger"
                                                onPress={() => handleDelete(plan.id)}
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

            {/* Create plan modal */}
            <Modal isOpen={isOpen} onClose={onClose} size="lg">
                <ModalContent>
                    <ModalHeader>Novo Plano de Investimento</ModalHeader>
                    <ModalBody className="gap-4">
                        <Select
                            label="Conta de Investimento"
                            selectedKeys={formData.accountId ? [formData.accountId] : []}
                            onSelectionChange={(keys) => {
                                const value = Array.from(keys)[0] as string;
                                setFormData({...formData, accountId: value});
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
                            label="Nome do Plano"
                            placeholder="Ex: Reserva de Emergência"
                            value={formData.name}
                            onValueChange={(value) => setFormData({...formData, name: value})}
                            isRequired
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Valor"
                                type="number"
                                placeholder="0,00"
                                startContent={<span className="text-gray-500">R$</span>}
                                value={formData.amount}
                                onValueChange={(value) => setFormData({...formData, amount: value})}
                                isRequired
                            />

                            <Select
                                label="Frequência"
                                selectedKeys={[formData.frequency]}
                                onSelectionChange={(keys) => {
                                    const value = Array.from(keys)[0] as typeof formData.frequency;
                                    setFormData({...formData, frequency: value});
                                }}
                            >
                                <SelectItem key="WEEKLY">Semanal</SelectItem>
                                <SelectItem key="BIWEEKLY">Quinzenal</SelectItem>
                                <SelectItem key="MONTHLY">Mensal</SelectItem>
                                <SelectItem key="YEARLY">Anual</SelectItem>
                            </Select>
                        </div>

                        <Input
                            label="Dia de Execução"
                            type="number"
                            min={1}
                            max={31}
                            placeholder="1"
                            value={formData.dayOfExecution}
                            onValueChange={(value) =>
                                setFormData({...formData, dayOfExecution: value})
                            }
                            description="Dia do mês (1-31) ou dia da semana (1-7 para semanal)"
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Data de Início"
                                type="date"
                                value={formData.startDate}
                                onValueChange={(value) =>
                                    setFormData({...formData, startDate: value})
                                }
                                isRequired
                            />

                            <Input
                                label="Data de Término (Opcional)"
                                type="date"
                                value={formData.endDate}
                                onValueChange={(value) => setFormData({...formData, endDate: value})}
                                description="Deixe vazio para indefinido"
                            />
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" onPress={onClose}>
                            Cancelar
                        </Button>
                        <Button color="primary" onPress={handleCreate} isLoading={formLoading}>
                            Criar Plano
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </div>
    );
}
