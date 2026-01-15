"use client";

import {useEffect, useState} from "react";
import {
    Button,
    Chip,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    Spinner,
    ButtonGroup,
    useDisclosure,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Input,
    Select,
    SelectItem,
} from "@nextui-org/react";
import {getEvents, getEventsWithProjection, confirmEvent, skipEvent, deleteEvent, updateEventPriority, updateEvent, type UpdateEventInput} from "@/features/events";
import {getAccountBalances, type AccountWithBalance} from "@/features/accounts";
import {formatCurrency, centsToDollars} from "@/types/finance";
import type {Event} from "@prisma/client";
import {toast} from "react-toastify";
import {EventForm} from "./event-form";
import {Plus, MoreVertical, Calendar, Pencil} from "lucide-react";

type TimeFilter = "all" | "past" | "upcoming" | "today";

export function EventsList() {
    const [events, setEvents] = useState<Event[]>([]);
    const [accounts, setAccounts] = useState<AccountWithBalance[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [timeFilter, setTimeFilter] = useState<TimeFilter>("upcoming");
    const {isOpen, onOpen, onClose} = useDisclosure();
    const {isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose} = useDisclosure();
    const [editLoading, setEditLoading] = useState(false);
    const [editData, setEditData] = useState<{
        id: string;
        accountId: string;
        description: string;
        amount: string;
        type: "INCOME" | "EXPENSE" | "INVESTMENT";
        costType: "RECURRENT" | "EXCEPTIONAL";
        priority: "REQUIRED" | "IMPORTANT" | "OPTIONAL";
        date: string;
        isGenerated: boolean;
        templateId?: string;
    } | null>(null);

    useEffect(() => {
        loadData();
    }, [timeFilter]);

    const loadData = async () => {
        setLoading(true);
        setError(null);

        // Load accounts
        const accountsResult = await getAccountBalances();
        if (accountsResult.success) {
            setAccounts(accountsResult.accounts);
        }

        // Build date filters
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let result;

        switch (timeFilter) {
            case "past": {
                const endDate = new Date(today);
                endDate.setDate(endDate.getDate() - 1);
                result = await getEvents({endDate});
                break;
            }
            case "today": {
                // Use projection to include recurring events for today
                const endOfToday = new Date(today);
                endOfToday.setHours(23, 59, 59, 999);
                result = await getEventsWithProjection(today, endOfToday);
                break;
            }
            case "upcoming": {
                // Use projection to include recurring events (next 90 days)
                const futureDate = new Date(today);
                futureDate.setDate(futureDate.getDate() + 60);
                result = await getEventsWithProjection(today, futureDate);
                break;
            }
            case "all":
            default: {
                // For "all", show stored events (not generated)
                result = await getEvents({});
                break;
            }
        }

        if (result.success) {
            setEvents(result.events);
        } else {
            setError(result.error);
        }

        setLoading(false);
    };

    const handleConfirm = async (eventId: string) => {
        const result = await confirmEvent(eventId);
        if (result.success) {
            toast.success("Evento confirmado");
            loadData();
        } else {
            toast.error(result.error);
        }
    };

    const handleSkip = async (eventId: string) => {
        const result = await skipEvent(eventId);
        if (result.success) {
            toast.success("Evento ignorado");
            loadData();
        } else {
            toast.error(result.error);
        }
    };

    const handleDelete = async (eventId: string) => {
        if (!confirm("Tem certeza que deseja excluir este evento?")) return;

        const result = await deleteEvent(eventId);
        if (result.success) {
            toast.success("Evento excluído");
            loadData();
        } else {
            toast.error(result.error);
        }
    };

    const formatDate = (date: Date) => {
        const d = new Date(date);
        return d.toLocaleDateString("pt-BR", {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    const isToday = (date: Date) => {
        const today = new Date();
        const d = new Date(date);
        return d.toDateString() === today.toDateString();
    };

    const isPast = (date: Date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const d = new Date(date);
        return d < today;
    };

    const typeColors: Record<string, "success" | "danger" | "primary"> = {
        INCOME: "success",
        EXPENSE: "danger",
        INVESTMENT: "primary",
    };

    const typeLabels: Record<string, string> = {
        INCOME: "Receita",
        EXPENSE: "Despesa",
        INVESTMENT: "Investimento",
    };

    const statusColors: Record<string, "default" | "success" | "warning"> = {
        PLANNED: "warning",
        CONFIRMED: "success",
        SKIPPED: "default",
    };

    const statusLabels: Record<string, string> = {
        PLANNED: "Planejado",
        CONFIRMED: "Confirmado",
        SKIPPED: "Ignorado",
    };

    const costTypeLabels: Record<string, string> = {
        FIXED: "Fixo",
        VARIABLE: "Variável",
        EXCEPTIONAL: "Excepcional",
        RECURRENT: "Recorrente",
    };

    const priorityLabels: Record<string, string> = {
        REQUIRED: "🔴 Obrigatório",
        IMPORTANT: "🟡 Importante",
        OPTIONAL: "🟢 Opcional",
    };

    const handlePriorityChange = async (eventId: string, priority: "REQUIRED" | "IMPORTANT" | "OPTIONAL") => {
        // Check if this is a generated event (from recurrence template)
        // Generated events have IDs like "generated-{templateId}-{index}"
        let targetId = eventId;
        if (eventId.startsWith("generated-")) {
            // Extract template ID from the generated event ID
            const parts = eventId.split("-");
            // Format: generated-{templateId}-{index}
            // Template ID is everything between "generated-" and the last "-{index}"
            targetId = parts.slice(1, -1).join("-");
        }

        const result = await updateEventPriority(targetId, priority);
        if (result.success) {
            toast.success("Prioridade atualizada");
            loadData();
        } else {
            toast.error(result.error);
        }
    };

    const handleEdit = (event: Event) => {
        // Check if this is a generated event
        const isGenerated = event.id.startsWith("generated-");
        let targetId = event.id;
        let templateId: string | undefined;

        if (isGenerated) {
            // Extract template ID for generated events
            const parts = event.id.split("-");
            templateId = parts.slice(1, -1).join("-");
            targetId = templateId;
        }

        setEditData({
            id: targetId,
            accountId: event.accountId,
            description: event.description,
            amount: centsToDollars(Math.abs(event.amount)).toString(),
            type: event.type as "INCOME" | "EXPENSE" | "INVESTMENT",
            costType: (event.costType as "RECURRENT" | "EXCEPTIONAL") || "RECURRENT",
            priority: event.priority as "REQUIRED" | "IMPORTANT" | "OPTIONAL",
            date: new Date(event.date).toISOString().split("T")[0],
            isGenerated,
            templateId,
        });
        onEditOpen();
    };

    const handleUpdate = async () => {
        if (!editData) return;

        if (!editData.description) {
            toast.error("Descrição é obrigatória");
            return;
        }

        setEditLoading(true);

        const input: UpdateEventInput = {
            id: editData.id,
            accountId: editData.accountId,
            description: editData.description,
            amount: parseFloat(editData.amount),
            type: editData.type,
            costType: editData.type === "EXPENSE" ? editData.costType : undefined,
            priority: editData.priority,
            date: new Date(editData.date),
        };

        const result = await updateEvent(input);

        if (result.success) {
            toast.success(editData.isGenerated ? "Modelo recorrente atualizado" : "Evento atualizado");
            loadData();
            onEditClose();
            setEditData(null);
        } else {
            toast.error(result.error);
        }

        setEditLoading(false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Spinner size="lg" label="Carregando eventos..."/>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <ButtonGroup>
                    <Button
                        color={timeFilter === "all" ? "primary" : "default"}
                        variant={timeFilter === "all" ? "solid" : "bordered"}
                        onPress={() => setTimeFilter("all")}
                    >
                        Todos
                    </Button>
                    <Button
                        color={timeFilter === "past" ? "primary" : "default"}
                        variant={timeFilter === "past" ? "solid" : "bordered"}
                        onPress={() => setTimeFilter("past")}
                    >
                        Passados
                    </Button>
                    <Button
                        color={timeFilter === "today" ? "primary" : "default"}
                        variant={timeFilter === "today" ? "solid" : "bordered"}
                        onPress={() => setTimeFilter("today")}
                    >
                        Hoje
                    </Button>
                    <Button
                        color={timeFilter === "upcoming" ? "primary" : "default"}
                        variant={timeFilter === "upcoming" ? "solid" : "bordered"}
                        onPress={() => setTimeFilter("upcoming")}
                    >
                        Próximos
                    </Button>
                </ButtonGroup>
                <Button
                    color="primary"
                    onPress={onOpen}
                    startContent={<Plus className="w-4 h-4"/>}
                >
                    Novo Evento
                </Button>
            </div>

            {/* Events list */}
            {error && (
                <div className="modern-card p-5 border-l-4 border-l-red-500">
                    <p className="text-red-600">{error}</p>
                    <Button color="primary" size="sm" className="mt-2" onPress={loadData}>
                        Tentar Novamente
                    </Button>
                </div>
            )}

            {!error && events.length === 0 && (
                <div className="modern-card p-12 text-center">
                    <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3"/>
                    <p className="text-slate-500">Nenhum evento encontrado.</p>
                    <Button color="primary" className="mt-4" onPress={onOpen}>
                        Criar seu primeiro evento
                    </Button>
                </div>
            )}

            {!error && events.length > 0 && (
                <div className="modern-card overflow-hidden">
                    <div className="divide-y divide-slate-200 dark:divide-slate-700">
                        {events.map((event) => (
                            <div
                                key={event.id}
                                className={`flex justify-between items-center p-4 ${
                                    isPast(event.date) && event.status === "PLANNED"
                                        ? "bg-yellow-50 dark:bg-yellow-900/20"
                                        : ""
                                }`}
                            >
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <Chip
                                            color={typeColors[event.type]}
                                            size="sm"
                                            variant="flat"
                                        >
                                            {typeLabels[event.type]}
                                        </Chip>
                                        <Chip
                                            color={statusColors[event.status]}
                                            size="sm"
                                            variant="bordered"
                                        >
                                            {statusLabels[event.status]}
                                        </Chip>
                                        {event.costType && (
                                            <Chip size="sm" variant="dot">
                                                {costTypeLabels[event.costType]}
                                            </Chip>
                                        )}
                                        {event.isRecurrenceTemplate && (
                                            <Chip size="sm" color="secondary" variant="flat">
                                                Recorrente
                                            </Chip>
                                        )}
                                        {event.type !== "INCOME" && (
                                            <Chip
                                                size="sm"
                                                variant="light"
                                                className="text-xs"
                                            >
                                                {priorityLabels[event.priority]}
                                            </Chip>
                                        )}
                                    </div>
                                    <span className="font-medium text-lg text-slate-900 dark:text-white">
                                        {event.description}
                                    </span>
                                    <span
                                        className={`text-sm ${
                                            isToday(event.date)
                                                ? "text-blue-600 font-medium"
                                                : "text-slate-500"
                                        }`}
                                    >
                                        {isToday(event.date) ? "Hoje" : formatDate(event.date)}
                                        {isPast(event.date) && event.status === "PLANNED" && (
                                            <span className="text-yellow-600 ml-2">(Atrasado)</span>
                                        )}
                                    </span>
                                </div>

                                <div className="flex items-center gap-4">
                                    <span
                                        className={`text-xl font-bold ${
                                            event.amount > 0 ? "text-green-600" : "text-red-600"
                                        }`}
                                    >
                                        {event.amount > 0 ? "+" : ""}
                                        {formatCurrency(event.amount)}
                                    </span>

                                    <Dropdown>
                                        <DropdownTrigger>
                                            <Button isIconOnly variant="light" size="sm">
                                                <MoreVertical className="w-4 h-4"/>
                                            </Button>
                                        </DropdownTrigger>
                                        <DropdownMenu
                                            aria-label="Ações do evento"
                                            onAction={(key) => {
                                                if (key === "edit") handleEdit(event);
                                                if (key === "confirm") handleConfirm(event.id);
                                                if (key === "skip") handleSkip(event.id);
                                                if (key === "delete") handleDelete(event.id);
                                                if (key === "priority-required") handlePriorityChange(event.id, "REQUIRED");
                                                if (key === "priority-important") handlePriorityChange(event.id, "IMPORTANT");
                                                if (key === "priority-optional") handlePriorityChange(event.id, "OPTIONAL");
                                            }}
                                        >
                                            <DropdownItem
                                                key="edit"
                                                startContent={<Pencil className="w-4 h-4"/>}
                                            >
                                                {event.id.startsWith("generated-") ? "Editar Modelo" : "Editar"}
                                            </DropdownItem>
                                            {event.status === "PLANNED" ? (
                                                <DropdownItem key="confirm">Confirmar</DropdownItem>
                                            ) : null}
                                            {event.status === "PLANNED" ? (
                                                <DropdownItem key="skip">Ignorar</DropdownItem>
                                            ) : null}
                                            {event.type !== "INCOME" && event.priority !== "REQUIRED" ? (
                                                <DropdownItem key="priority-required">
                                                    🔴 Marcar como Obrigatório
                                                </DropdownItem>
                                            ) : null}
                                            {event.type !== "INCOME" && event.priority !== "IMPORTANT" ? (
                                                <DropdownItem key="priority-important">
                                                    🟡 Marcar como Importante
                                                </DropdownItem>
                                            ) : null}
                                            {event.type !== "INCOME" && event.priority !== "OPTIONAL" ? (
                                                <DropdownItem key="priority-optional">
                                                    🟢 Marcar como Opcional
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
                        ))}
                    </div>
                </div>
            )}

            {/* Event form modal */}
            <EventForm
                isOpen={isOpen}
                onClose={onClose}
                onSuccess={loadData}
                accounts={accounts}
            />

            {/* Edit event modal */}
            <Modal isOpen={isEditOpen} onClose={onEditClose} size="lg">
                <ModalContent>
                    <ModalHeader>
                        {editData?.isGenerated ? "Editar Modelo Recorrente" : "Editar Evento"}
                    </ModalHeader>
                    <ModalBody className="gap-4">
                        {editData?.isGenerated && (
                            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-2">
                                <p className="text-sm text-amber-700 dark:text-amber-300">
                                    Você está editando o modelo recorrente. As alterações afetarão todas as ocorrências futuras.
                                </p>
                            </div>
                        )}

                        <Select
                            label="Conta"
                            selectedKeys={editData?.accountId ? [editData.accountId] : []}
                            onSelectionChange={(keys) => {
                                const value = Array.from(keys)[0] as string;
                                setEditData(prev => prev ? {...prev, accountId: value} : null);
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
                            label="Descrição"
                            placeholder="Ex: Aluguel mensal"
                            value={editData?.description || ""}
                            onValueChange={(value) => setEditData(prev => prev ? {...prev, description: value} : null)}
                            isRequired
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Valor"
                                type="number"
                                placeholder="0,00"
                                startContent={<span className="text-gray-500">R$</span>}
                                value={editData?.amount || ""}
                                onValueChange={(value) => setEditData(prev => prev ? {...prev, amount: value} : null)}
                                isRequired
                            />

                            <Select
                                label="Tipo"
                                selectedKeys={editData?.type ? [editData.type] : []}
                                onSelectionChange={(keys) => {
                                    const value = Array.from(keys)[0] as "INCOME" | "EXPENSE" | "INVESTMENT";
                                    setEditData(prev => prev ? {...prev, type: value} : null);
                                }}
                                isRequired
                            >
                                <SelectItem key="INCOME" textValue="Receita">Receita (+)</SelectItem>
                                <SelectItem key="EXPENSE" textValue="Despesa">Despesa (-)</SelectItem>
                                <SelectItem key="INVESTMENT" textValue="Investimento">Investimento (-)</SelectItem>
                            </Select>
                        </div>

                        {editData?.type === "EXPENSE" && (
                            <Select
                                label="Tipo de Custo"
                                selectedKeys={editData?.costType ? [editData.costType] : []}
                                onSelectionChange={(keys) => {
                                    const value = Array.from(keys)[0] as "RECURRENT" | "EXCEPTIONAL";
                                    setEditData(prev => prev ? {...prev, costType: value} : null);
                                }}
                            >
                                <SelectItem key="RECURRENT" textValue="Recorrente">
                                    Recorrente (aluguel, contas, assinaturas)
                                </SelectItem>
                                <SelectItem key="EXCEPTIONAL" textValue="Excepcional">
                                    Excepcional (viagens, emergências)
                                </SelectItem>
                            </Select>
                        )}

                        {editData?.type !== "INCOME" && (
                            <Select
                                label="Prioridade"
                                selectedKeys={editData?.priority ? [editData.priority] : []}
                                onSelectionChange={(keys) => {
                                    const value = Array.from(keys)[0] as "REQUIRED" | "IMPORTANT" | "OPTIONAL";
                                    setEditData(prev => prev ? {...prev, priority: value} : null);
                                }}
                            >
                                <SelectItem key="REQUIRED" textValue="Obrigatório">
                                    🔴 Obrigatório (não pode ser adiado)
                                </SelectItem>
                                <SelectItem key="IMPORTANT" textValue="Importante">
                                    🟡 Importante (deveria ser pago)
                                </SelectItem>
                                <SelectItem key="OPTIONAL" textValue="Opcional">
                                    🟢 Opcional (pode ser adiado)
                                </SelectItem>
                            </Select>
                        )}

                        <Input
                            label="Data"
                            type="date"
                            value={editData?.date || ""}
                            onValueChange={(value) => setEditData(prev => prev ? {...prev, date: value} : null)}
                            isRequired
                        />
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" onPress={onEditClose}>
                            Cancelar
                        </Button>
                        <Button color="primary" onPress={handleUpdate} isLoading={editLoading}>
                            Salvar Alterações
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </div>
    );
}
