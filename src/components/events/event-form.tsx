"use client";

import {useState} from "react";
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Input,
    Select,
    SelectItem,
    Switch,
} from "@nextui-org/react";
import {createEvent, type CreateEventInput} from "@/features/events";
import type {AccountWithBalance} from "@/features/accounts";
import {toast} from "react-toastify";

interface EventFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    accounts: AccountWithBalance[];
}

export function EventForm({isOpen, onClose, onSuccess, accounts}: EventFormProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<{
        accountId: string;
        description: string;
        amount: string;
        type: "INCOME" | "EXPENSE" | "INVESTMENT";
        costType: "RECURRENT" | "EXCEPTIONAL";
        date: string;
        isRecurring: boolean;
        recurrenceFrequency: string;
    }>({
        accountId: accounts[0]?.id || "",
        description: "",
        amount: "",
        type: "EXPENSE",
        costType: "RECURRENT",
        date: new Date().toISOString().split("T")[0],
        isRecurring: false,
        recurrenceFrequency: "MONTHLY",
    });

    const handleSubmit = async () => {
        if (!formData.accountId || !formData.description || !formData.amount) {
            toast.error("Por favor, preencha todos os campos obrigatórios");
            return;
        }

        setLoading(true);

        const input: CreateEventInput = {
            accountId: formData.accountId,
            description: formData.description,
            amount: parseFloat(formData.amount),
            type: formData.type,
            costType: formData.type === "EXPENSE" ? formData.costType : undefined,
            date: new Date(formData.date),
            isRecurring: formData.isRecurring,
            recurrenceFrequency: formData.isRecurring
                ? (formData.recurrenceFrequency as CreateEventInput["recurrenceFrequency"])
                : undefined,
        };

        const result = await createEvent(input);

        if (result.success) {
            toast.success("Evento criado com sucesso");
            onSuccess();
            onClose();
            // Reset form
            setFormData({
                accountId: accounts[0]?.id || "",
                description: "",
                amount: "",
                type: "EXPENSE",
                costType: "RECURRENT",
                date: new Date().toISOString().split("T")[0],
                isRecurring: false,
                recurrenceFrequency: "MONTHLY",
            });
        } else {
            toast.error(result.error);
        }

        setLoading(false);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
            <ModalContent>
                <ModalHeader>Novo Evento</ModalHeader>
                <ModalBody className="gap-4">
                    <Select
                        label="Conta"
                        selectedKeys={formData.accountId ? [formData.accountId] : []}
                        onSelectionChange={(keys) => {
                            const value = Array.from(keys)[0] as string;
                            setFormData({...formData, accountId: value});
                        }}
                        isRequired
                    >
                        {accounts.map((account) => (
                            <SelectItem key={account.id} textValue={account.name}>
                                {account.name} ({account.type === "BANK" ? "Banco" :
                                account.type === "CASH" ? "Dinheiro" : "Investimento"})
                            </SelectItem>
                        ))}
                    </Select>

                    <Input
                        label="Descrição"
                        placeholder="Ex: Aluguel mensal"
                        value={formData.description}
                        onValueChange={(value) => setFormData({...formData, description: value})}
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
                            label="Tipo"
                            selectedKeys={[formData.type]}
                            onSelectionChange={(keys) => {
                                const value = Array.from(keys)[0] as "INCOME" | "EXPENSE" | "INVESTMENT";
                                setFormData({...formData, type: value});
                            }}
                            isRequired
                        >
                            <SelectItem key="INCOME" textValue="Receita">Receita (+)</SelectItem>
                            <SelectItem key="EXPENSE" textValue="Despesa">Despesa (-)</SelectItem>
                            <SelectItem key="INVESTMENT" textValue="Investimento">Investimento (-)</SelectItem>
                        </Select>
                    </div>

                    {formData.type === "EXPENSE" && (
                        <Select
                            label="Tipo de Custo"
                            selectedKeys={[formData.costType]}
                            onSelectionChange={(keys) => {
                                const value = Array.from(keys)[0] as "RECURRENT" | "EXCEPTIONAL";
                                setFormData({...formData, costType: value});
                            }}
                            description="Custos recorrentes são usados para planejamento de longo prazo. Custos excepcionais são gastos únicos."
                        >
                            <SelectItem key="RECURRENT" textValue="Recorrente">
                                Recorrente (aluguel, contas, assinaturas)
                            </SelectItem>
                            <SelectItem key="EXCEPTIONAL" textValue="Excepcional">
                                Excepcional (viagens, emergências)
                            </SelectItem>
                        </Select>
                    )}

                    <Input
                        label="Data"
                        type="date"
                        value={formData.date}
                        onValueChange={(value) => setFormData({...formData, date: value})}
                        isRequired
                    />

                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-slate-900 dark:text-white">Evento Recorrente</p>
                            <p className="text-sm text-slate-500">
                                Este evento se repete em uma agenda
                            </p>
                        </div>
                        <Switch
                            isSelected={formData.isRecurring}
                            onValueChange={(value) =>
                                setFormData({...formData, isRecurring: value})
                            }
                        />
                    </div>

                    {formData.isRecurring && (
                        <Select
                            label="Frequência"
                            selectedKeys={[formData.recurrenceFrequency]}
                            onSelectionChange={(keys) => {
                                const value = Array.from(keys)[0] as string;
                                setFormData({...formData, recurrenceFrequency: value});
                            }}
                        >
                            <SelectItem key="DAILY">Diário</SelectItem>
                            <SelectItem key="WEEKLY">Semanal</SelectItem>
                            <SelectItem key="BIWEEKLY">Quinzenal</SelectItem>
                            <SelectItem key="MONTHLY">Mensal</SelectItem>
                            <SelectItem key="YEARLY">Anual</SelectItem>
                        </Select>
                    )}
                </ModalBody>
                <ModalFooter>
                    <Button variant="flat" onPress={onClose}>
                        Cancelar
                    </Button>
                    <Button color="primary" onPress={handleSubmit} isLoading={loading}>
                        Criar Evento
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
