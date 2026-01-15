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
} from "@nextui-org/react";
import {getEvents, getEventsWithProjection, confirmEvent, skipEvent, deleteEvent, updateEventPriority} from "@/features/events";
import {getAccountBalances, type AccountWithBalance} from "@/features/accounts";
import {formatCurrency} from "@/types/finance";
import type {Event} from "@prisma/client";
import {toast} from "react-toastify";
import {EventForm} from "./event-form";
import {Plus, MoreVertical, Calendar} from "lucide-react";

type TimeFilter = "all" | "past" | "upcoming" | "today";

export function EventsList() {
    const [events, setEvents] = useState<Event[]>([]);
    const [accounts, setAccounts] = useState<AccountWithBalance[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [timeFilter, setTimeFilter] = useState<TimeFilter>("upcoming");
    const {isOpen, onOpen, onClose} = useDisclosure();

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
        const result = await updateEventPriority(eventId, priority);
        if (result.success) {
            toast.success("Prioridade atualizada");
            loadData();
        } else {
            toast.error(result.error);
        }
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
                                                if (key === "confirm") handleConfirm(event.id);
                                                if (key === "skip") handleSkip(event.id);
                                                if (key === "delete") handleDelete(event.id);
                                                if (key === "priority-required") handlePriorityChange(event.id, "REQUIRED");
                                                if (key === "priority-important") handlePriorityChange(event.id, "IMPORTANT");
                                                if (key === "priority-optional") handlePriorityChange(event.id, "OPTIONAL");
                                            }}
                                        >
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
        </div>
    );
}
