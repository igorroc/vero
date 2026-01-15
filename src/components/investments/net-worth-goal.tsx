"use client";

import {useEffect, useState} from "react";
import {
    Button,
    Chip,
    Progress,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Input,
    useDisclosure,
} from "@nextui-org/react";
import {
    getNetWorthSummary,
    setNetWorthGoal,
    type SetNetWorthGoalInput,
} from "@/features/goals";
import {formatCurrency, type NetWorthSummary} from "@/types/finance";
import {toast} from "react-toastify";
import {Target, TrendingUp, Edit3} from "lucide-react";

export function NetWorthGoalCard() {
    const [summary, setSummary] = useState<NetWorthSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [noGoal, setNoGoal] = useState(false);
    const {isOpen, onOpen, onClose} = useDisclosure();
    const [formLoading, setFormLoading] = useState(false);
    const [formData, setFormData] = useState({
        targetAmount: "",
        targetDate: "",
    });

    useEffect(() => {
        loadSummary();
    }, []);

    const loadSummary = async () => {
        setLoading(true);
        setNoGoal(false);

        const result = await getNetWorthSummary();

        if (result.success) {
            setSummary(result.summary);
        } else if (result.error === "No net worth goal set") {
            setNoGoal(true);
        }

        setLoading(false);
    };

    const handleSetGoal = async () => {
        if (!formData.targetAmount || !formData.targetDate) {
            toast.error("Por favor, preencha todos os campos");
            return;
        }

        setFormLoading(true);

        const input: SetNetWorthGoalInput = {
            targetAmount: parseFloat(formData.targetAmount),
            targetDate: new Date(formData.targetDate),
        };

        const result = await setNetWorthGoal(input);

        if (result.success) {
            toast.success("Meta definida com sucesso!");
            loadSummary();
            onClose();
        } else {
            toast.error(result.error);
        }

        setFormLoading(false);
    };

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString("pt-BR", {
            month: "short",
            year: "numeric",
        });
    };

    if (loading) {
        return (
            <div className="modern-card p-6 text-center">
                <p className="text-slate-500">Carregando meta...</p>
            </div>
        );
    }

    if (noGoal) {
        return (
            <>
                <div className="modern-card p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                            <Target className="w-5 h-5 text-purple-600 dark:text-purple-400"/>
                        </div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                            Meta de Patrimônio
                        </h2>
                    </div>
                    <div className="text-center py-6">
                        <Target className="w-12 h-12 text-slate-300 mx-auto mb-3"/>
                        <p className="text-slate-500 mb-4">
                            Defina uma meta de patrimônio para acompanhar seu progresso.
                        </p>
                        <Button color="primary" onPress={onOpen}>
                            Definir Meta
                        </Button>
                    </div>
                </div>

                <Modal isOpen={isOpen} onClose={onClose}>
                    <ModalContent>
                        <ModalHeader>Definir Meta de Patrimônio</ModalHeader>
                        <ModalBody className="gap-4">
                            <Input
                                label="Valor Alvo"
                                type="number"
                                placeholder="500000"
                                startContent={<span className="text-gray-500">R$</span>}
                                value={formData.targetAmount}
                                onValueChange={(value) =>
                                    setFormData({...formData, targetAmount: value})
                                }
                                isRequired
                            />
                            <Input
                                label="Data Alvo"
                                type="date"
                                value={formData.targetDate}
                                onValueChange={(value) =>
                                    setFormData({...formData, targetDate: value})
                                }
                                isRequired
                            />
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={onClose}>
                                Cancelar
                            </Button>
                            <Button color="primary" onPress={handleSetGoal} isLoading={formLoading}>
                                Definir Meta
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            </>
        );
    }

    if (!summary) return null;

    const progressPercent = Math.min(
        100,
        (summary.currentNetWorth / summary.targetNetWorth) * 100
    );

    return (
        <>
            <div className="modern-card p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                            <Target className="w-5 h-5 text-purple-600 dark:text-purple-400"/>
                        </div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                            Meta de Patrimônio
                        </h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <Chip
                            color={summary.isOnTrack ? "success" : "warning"}
                            variant="flat"
                            size="sm"
                        >
                            {summary.isOnTrack ? "No caminho" : "Atrasado"}
                        </Chip>
                        <Button size="sm" variant="light" isIconOnly onPress={onOpen}>
                            <Edit3 className="w-4 h-4"/>
                        </Button>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="mb-6">
                    <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-500">Progresso</span>
                        <span className="font-medium text-slate-900 dark:text-white">
                            {progressPercent.toFixed(1)}%
                        </span>
                    </div>
                    <Progress
                        value={progressPercent}
                        color={summary.isOnTrack ? "success" : "warning"}
                        className="h-3"
                    />
                </div>

                {/* Current vs Target */}
                <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                        <p className="text-sm text-slate-500 mb-1">Atual</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">
                            {formatCurrency(summary.currentNetWorth)}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 mb-1">Meta</p>
                        <p className="text-2xl font-bold text-purple-600">
                            {formatCurrency(summary.targetNetWorth)}
                        </p>
                        <p className="text-xs text-slate-500">
                            até {formatDate(summary.targetDate)}
                        </p>
                    </div>
                </div>

                {/* Monthly investment comparison */}
                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                            Investimento Mensal Atual
                        </span>
                        <span className="font-medium text-slate-900 dark:text-white">
                            {formatCurrency(summary.currentMonthlyInvestment)}
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                            Investimento Mensal Necessário
                        </span>
                        <span
                            className={`font-medium ${
                                summary.currentMonthlyInvestment >= summary.requiredMonthlyInvestment
                                    ? "text-green-600"
                                    : "text-red-600"
                            }`}
                        >
                            {formatCurrency(summary.requiredMonthlyInvestment)}
                        </span>
                    </div>
                    <div className="flex justify-between items-center border-t border-slate-200 dark:border-slate-700 pt-3">
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                            Meses Restantes
                        </span>
                        <span className="font-medium text-slate-900 dark:text-white">
                            {summary.monthsRemaining}
                        </span>
                    </div>
                </div>

                {/* Projection */}
                <div
                    className={`mt-4 rounded-xl p-4 ${
                        summary.isOnTrack
                            ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                            : "bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800"
                    }`}
                >
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp
                            className={`w-4 h-4 ${
                                summary.isOnTrack ? "text-green-600" : "text-yellow-600"
                            }`}
                        />
                        <p
                            className={`text-sm font-medium ${
                                summary.isOnTrack
                                    ? "text-green-700 dark:text-green-400"
                                    : "text-yellow-700 dark:text-yellow-400"
                            }`}
                        >
                            Projeção na Data Alvo
                        </p>
                    </div>
                    <p
                        className={`text-xl font-bold ${
                            summary.isOnTrack ? "text-green-600" : "text-yellow-600"
                        }`}
                    >
                        {formatCurrency(summary.projectedNetWorth)}
                    </p>
                    <p
                        className={`text-sm ${
                            summary.gap >= 0 ? "text-green-600" : "text-red-600"
                        }`}
                    >
                        {summary.gap >= 0 ? "+" : ""}
                        {formatCurrency(summary.gap)} vs meta
                    </p>
                </div>
            </div>

            {/* Edit modal */}
            <Modal isOpen={isOpen} onClose={onClose}>
                <ModalContent>
                    <ModalHeader>Editar Meta de Patrimônio</ModalHeader>
                    <ModalBody className="gap-4">
                        <Input
                            label="Valor Alvo"
                            type="number"
                            placeholder="500000"
                            startContent={<span className="text-gray-500">R$</span>}
                            value={formData.targetAmount}
                            onValueChange={(value) =>
                                setFormData({...formData, targetAmount: value})
                            }
                            isRequired
                        />
                        <Input
                            label="Data Alvo"
                            type="date"
                            value={formData.targetDate}
                            onValueChange={(value) =>
                                setFormData({...formData, targetDate: value})
                            }
                            isRequired
                        />
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" onPress={onClose}>
                            Cancelar
                        </Button>
                        <Button color="primary" onPress={handleSetGoal} isLoading={formLoading}>
                            Atualizar Meta
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    );
}
