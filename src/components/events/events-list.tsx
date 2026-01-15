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
import {
    getEvents,
    getEventsWithProjection,
    confirmEvent,
    skipEvent,
    deleteEvent,
    updateEventPriority,
    updateEvent,
    type UpdateEventInput
} from "@/features/events";
import {getAccountBalances, type AccountWithBalance} from "@/features/accounts";
import {formatCurrency, centsToDollars} from "@/types/finance";
import type {Event} from "@prisma/client";
import {toast} from "react-toastify";
import {EventForm} from "./event-form";
import {
    Plus,
    MoreVertical,
    Calendar,
    Pencil,
    ShoppingBag,
    Utensils,
    Car,
    Home,
    TrendingUp,
    Heart,
    Zap,
    CreditCard,
    CircleDollarSign,
    ChevronDown
} from "lucide-react";

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

    const priorityLabels: Record<string, string> = {
        REQUIRED: "🔴 Obrigatório",
        IMPORTANT: "🟡 Importante",
        OPTIONAL: "🟢 Opcional",
    };

    // Icon and color mapping for event types
    const getEventIcon = (description: string, type: string) => {
        const desc = description.toLowerCase();
        if (desc.includes("aluguel") || desc.includes("casa") || desc.includes("moradia")) return Home;
        if (desc.includes("mercado") || desc.includes("compra") || desc.includes("shopping")) return ShoppingBag;
        if (desc.includes("restaurante") || desc.includes("comida") || desc.includes("alimenta")) return Utensils;
        if (desc.includes("transporte") || desc.includes("uber") || desc.includes("carro") || desc.includes("gasolina")) return Car;
        if (desc.includes("saúde") || desc.includes("médico") || desc.includes("farmácia")) return Heart;
        if (desc.includes("energia") || desc.includes("luz") || desc.includes("água") || desc.includes("internet")) return Zap;
        if (type === "INVESTMENT") return TrendingUp;
        if (type === "INCOME") return CircleDollarSign;
        return CreditCard;
    };

    const getEventColors = (type: string, description: string) => {
        const desc = description.toLowerCase();
        if (type === "INCOME") return {
            bg: "bg-emerald-100 dark:bg-emerald-900/30",
            icon: "text-emerald-600 dark:text-emerald-400"
        };
        if (type === "INVESTMENT") return {
            bg: "bg-blue-100 dark:bg-blue-900/30",
            icon: "text-blue-600 dark:text-blue-400"
        };
        if (desc.includes("aluguel") || desc.includes("casa")) return {
            bg: "bg-purple-100 dark:bg-purple-900/30",
            icon: "text-purple-600 dark:text-purple-400"
        };
        if (desc.includes("mercado") || desc.includes("compra") || desc.includes("shopping")) return {
            bg: "bg-cyan-100 dark:bg-cyan-900/30",
            icon: "text-cyan-600 dark:text-cyan-400"
        };
        if (desc.includes("restaurante") || desc.includes("comida")) return {
            bg: "bg-indigo-100 dark:bg-indigo-900/30",
            icon: "text-indigo-600 dark:text-indigo-400"
        };
        if (desc.includes("transporte") || desc.includes("uber") || desc.includes("carro")) return {
            bg: "bg-amber-100 dark:bg-amber-900/30",
            icon: "text-amber-600 dark:text-amber-400"
        };
        if (desc.includes("energia") || desc.includes("luz") || desc.includes("água")) return {
            bg: "bg-orange-100 dark:bg-orange-900/30",
            icon: "text-orange-600 dark:text-orange-400"
        };
        return {bg: "bg-rose-100 dark:bg-rose-900/30", icon: "text-rose-600 dark:text-rose-400"};
    };

    // Calculate budget summary
    const calculateBudgetSummary = () => {
        const totalExpenses = events
            .filter(e => e.type === "EXPENSE" && e.status !== "SKIPPED")
            .reduce((sum, e) => sum + Math.abs(e.amount), 0);
        const totalIncome = events
            .filter(e => e.type === "INCOME" && e.status !== "SKIPPED")
            .reduce((sum, e) => sum + e.amount, 0);
        const confirmedExpenses = events
            .filter(e => e.type === "EXPENSE" && e.status === "CONFIRMED")
            .reduce((sum, e) => sum + Math.abs(e.amount), 0);

        return {
            totalExpenses,
            totalIncome,
            confirmedExpenses,
            progress: totalExpenses > 0 ? (confirmedExpenses / totalExpenses) * 100 : 0,
        };
    };

    const budgetSummary = calculateBudgetSummary();

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

    // Get current month name
    const currentMonth = new Date().toLocaleDateString("pt-BR", {month: "long"});

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Budget Summary Card - Inspired by Figma */}
            {events.length > 0 && (
                <div
                    className="bg-gradient-to-r from-indigo-900 to-indigo-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-white relative overflow-hidden">
                    {/* Decorative elements */}
                    <div
                        className="absolute top-4 right-4 w-16 h-16 sm:w-20 sm:h-20 bg-pink-500/20 rounded-full blur-xl"/>
                    <div
                        className="absolute bottom-4 right-12 w-10 h-10 sm:w-12 sm:h-12 bg-teal-500/30 rounded-full blur-lg"/>

                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 relative z-10">
                        <div className="space-y-1">
                            <p className="text-indigo-200 text-sm font-medium capitalize">
                                Orçamento de {currentMonth}
                            </p>
                            <p className="text-2xl sm:text-3xl font-bold">
                                {formatCurrency(budgetSummary.totalExpenses)}
                            </p>
                        </div>
                        <div className="text-right hidden sm:block">
                            <p className="text-indigo-200 text-sm">Receitas</p>
                            <p className="text-lg font-semibold text-emerald-400">
                                +{formatCurrency(budgetSummary.totalIncome)}
                            </p>
                        </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-4 space-y-2 relative z-10">
                        <div className="flex justify-between text-xs sm:text-sm text-indigo-200">
                            <span>Confirmado</span>
                            <span>{Math.round(budgetSummary.progress)}%</span>
                        </div>
                        <div className="h-1.5 sm:h-2 bg-white/20 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500"
                                style={{width: `${budgetSummary.progress}%`}}
                            />
                        </div>
                    </div>

                    {/* Mobile income display */}
                    <div className="mt-3 sm:hidden flex justify-between text-sm">
                        <span className="text-indigo-200">Receitas esperadas</span>
                        <span
                            className="text-emerald-400 font-medium">+{formatCurrency(budgetSummary.totalIncome)}</span>
                    </div>
                </div>
            )}

            {/* Header with filters */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                {/* Mobile: Dropdown filter */}
                <div className="w-full sm:hidden">
                    <Dropdown>
                        <DropdownTrigger>
                            <Button
                                variant="flat"
                                className="w-full justify-between"
                                endContent={<ChevronDown className="w-4 h-4"/>}
                            >
                                {timeFilter === "all" && "Todos os eventos"}
                                {timeFilter === "past" && "Eventos passados"}
                                {timeFilter === "today" && "Eventos de hoje"}
                                {timeFilter === "upcoming" && "Próximos eventos"}
                            </Button>
                        </DropdownTrigger>
                        <DropdownMenu
                            aria-label="Filtro de tempo"
                            selectionMode="single"
                            selectedKeys={[timeFilter]}
                            onSelectionChange={(keys) => {
                                const value = Array.from(keys)[0] as TimeFilter;
                                setTimeFilter(value);
                            }}
                        >
                            <DropdownItem key="all">Todos os eventos</DropdownItem>
                            <DropdownItem key="past">Eventos passados</DropdownItem>
                            <DropdownItem key="today">Eventos de hoje</DropdownItem>
                            <DropdownItem key="upcoming">Próximos eventos</DropdownItem>
                        </DropdownMenu>
                    </Dropdown>
                </div>

                {/* Desktop: Button group filter */}
                <div className="hidden sm:flex gap-2 flex-wrap">
                    {[
                        {key: "all", label: "Todos"},
                        {key: "past", label: "Passados"},
                        {key: "today", label: "Hoje"},
                        {key: "upcoming", label: "Próximos"},
                    ].map((filter) => (
                        <Button
                            key={filter.key}
                            size="sm"
                            radius="full"
                            color={timeFilter === filter.key ? "primary" : "default"}
                            variant={timeFilter === filter.key ? "solid" : "flat"}
                            onPress={() => setTimeFilter(filter.key as TimeFilter)}
                        >
                            {filter.label}
                        </Button>
                    ))}
                </div>

                <Button
                    color="primary"
                    onPress={onOpen}
                    radius="full"
                    className="w-full sm:w-auto"
                    startContent={<Plus className="w-4 h-4"/>}
                >
                    Novo Evento
                </Button>
            </div>

            {/* Section title */}
            <div className="flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">
                    Seus Eventos
                </h2>
                <span className="text-xs sm:text-sm text-slate-500">
                    {events.length} {events.length === 1 ? "evento" : "eventos"}
                </span>
            </div>

            {/* Events list */}
            {error && (
                <div className="modern-card p-4 sm:p-5 border-l-4 border-l-red-500">
                    <p className="text-red-600 text-sm sm:text-base">{error}</p>
                    <Button color="primary" size="sm" className="mt-2" onPress={loadData}>
                        Tentar Novamente
                    </Button>
                </div>
            )}

            {!error && events.length === 0 && (
                <div className="modern-card p-8 sm:p-12 text-center">
                    <div
                        className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Calendar className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400"/>
                    </div>
                    <p className="text-slate-500 mb-4">Nenhum evento encontrado.</p>
                    <Button color="primary" radius="full" onPress={onOpen}>
                        Criar seu primeiro evento
                    </Button>
                </div>
            )}

            {!error && events.length > 0 && (
                <div className="space-y-3">
                    {events.map((event) => {
                        const EventIcon = getEventIcon(event.description, event.type);
                        const colors = getEventColors(event.type, event.description);
                        const isOverdue = isPast(event.date) && event.status === "PLANNED";

                        return (
                            <div
                                key={event.id}
                                className={`bg-white dark:bg-slate-900 rounded-2xl sm:rounded-[20px] p-3 sm:p-4 shadow-sm hover:shadow-md transition-shadow border border-slate-100 dark:border-slate-800 ${
                                    isOverdue ? "ring-2 ring-amber-400/50" : ""
                                }`}
                            >
                                <div className="flex items-center gap-3 sm:gap-4">
                                    {/* Icon */}
                                    <div
                                        className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl sm:rounded-[18px] ${colors.bg} flex items-center justify-center flex-shrink-0`}>
                                        <EventIcon className={`w-6 h-6 sm:w-8 sm:h-8 ${colors.icon}`}/>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <h3 className="font-semibold text-slate-900 dark:text-white text-sm sm:text-base truncate">
                                                    {event.description}
                                                </h3>
                                                <p className={`text-xs sm:text-sm mt-0.5 ${
                                                    isToday(event.date)
                                                        ? "text-blue-600 font-medium"
                                                        : isOverdue
                                                            ? "text-amber-600"
                                                            : "text-slate-500"
                                                }`}>
                                                    {isToday(event.date) ? "Hoje" : formatDate(event.date)}
                                                    {isOverdue && " • Atrasado"}
                                                </p>
                                            </div>

                                            <div className="text-right flex-shrink-0">
                                                <p className={`font-semibold text-sm sm:text-base ${
                                                    event.amount > 0
                                                        ? "text-emerald-600"
                                                        : "text-slate-900 dark:text-white"
                                                }`}>
                                                    {event.amount > 0 ? "+" : ""}
                                                    {formatCurrency(event.amount)}
                                                </p>
                                                <p className="text-xs text-slate-400 mt-0.5 hidden sm:block">
                                                    {statusLabels[event.status]}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Tags row */}
                                        <div className="flex items-center gap-1.5 sm:gap-2 mt-2 flex-wrap">
                                            <Chip
                                                size="sm"
                                                variant="flat"
                                                color={typeColors[event.type]}
                                                className="text-[10px] sm:text-xs h-5 sm:h-6"
                                            >
                                                {typeLabels[event.type]}
                                            </Chip>
                                            {event.isRecurrenceTemplate && (
                                                <Chip
                                                    size="sm"
                                                    variant="flat"
                                                    color="secondary"
                                                    className="text-[10px] sm:text-xs h-5 sm:h-6"
                                                >
                                                    Recorrente
                                                </Chip>
                                            )}
                                            {event.type !== "INCOME" && (
                                                <span className="text-[10px] sm:text-xs text-slate-500">
                                                    {priorityLabels[event.priority]}
                                                </span>
                                            )}

                                            {/* Mobile status chip */}
                                            <Chip
                                                size="sm"
                                                variant="bordered"
                                                color={statusColors[event.status]}
                                                className="text-[10px] sm:text-xs h-5 sm:h-6 sm:hidden ml-auto"
                                            >
                                                {statusLabels[event.status]}
                                            </Chip>
                                        </div>
                                    </div>

                                    {/* Actions menu */}
                                    <Dropdown>
                                        <DropdownTrigger>
                                            <Button
                                                isIconOnly
                                                variant="light"
                                                size="sm"
                                                radius="full"
                                                className="flex-shrink-0"
                                            >
                                                <MoreVertical className="w-4 h-4 sm:w-5 sm:h-5"/>
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
                        );
                    })}
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
            <Modal
                isOpen={isEditOpen}
                onClose={onEditClose}
                size="lg"
                scrollBehavior="inside"
                classNames={{
                    base: "mx-2 sm:mx-0",
                    body: "py-4",
                }}
            >
                <ModalContent>
                    <ModalHeader className="text-lg sm:text-xl">
                        {editData?.isGenerated ? "Editar Modelo Recorrente" : "Editar Evento"}
                    </ModalHeader>
                    <ModalBody className="gap-3 sm:gap-4">
                        {editData?.isGenerated && (
                            <div
                                className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
                                <p className="text-xs sm:text-sm text-amber-700 dark:text-amber-300">
                                    As alterações afetarão todas as ocorrências futuras.
                                </p>
                            </div>
                        )}

                        <Select
                            label="Conta"
                            size="sm"
                            selectedKeys={editData?.accountId ? [editData.accountId] : []}
                            onSelectionChange={(keys) => {
                                const value = Array.from(keys)[0] as string;
                                setEditData(prev => prev ? {...prev, accountId: value} : null);
                            }}
                            isRequired
                            classNames={{label: "text-sm"}}
                        >
                            {accounts.map((account) => (
                                <SelectItem key={account.id} textValue={account.name}>
                                    {account.name}
                                </SelectItem>
                            ))}
                        </Select>

                        <Input
                            label="Descrição"
                            size="sm"
                            placeholder="Ex: Aluguel mensal"
                            value={editData?.description || ""}
                            onValueChange={(value) => setEditData(prev => prev ? {...prev, description: value} : null)}
                            isRequired
                            classNames={{label: "text-sm"}}
                        />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <Input
                                label="Valor"
                                size="sm"
                                type="number"
                                placeholder="0,00"
                                startContent={<span className="text-gray-500 text-sm">R$</span>}
                                value={editData?.amount || ""}
                                onValueChange={(value) => setEditData(prev => prev ? {...prev, amount: value} : null)}
                                isRequired
                                classNames={{label: "text-sm"}}
                            />

                            <Select
                                label="Tipo"
                                size="sm"
                                selectedKeys={editData?.type ? [editData.type] : []}
                                onSelectionChange={(keys) => {
                                    const value = Array.from(keys)[0] as "INCOME" | "EXPENSE" | "INVESTMENT";
                                    setEditData(prev => prev ? {...prev, type: value} : null);
                                }}
                                isRequired
                                classNames={{label: "text-sm"}}
                            >
                                <SelectItem key="INCOME" textValue="Receita">Receita (+)</SelectItem>
                                <SelectItem key="EXPENSE" textValue="Despesa">Despesa (-)</SelectItem>
                                <SelectItem key="INVESTMENT" textValue="Investimento">Investimento (-)</SelectItem>
                            </Select>
                        </div>

                        {editData?.type === "EXPENSE" && (
                            <Select
                                label="Tipo de Custo"
                                size="sm"
                                selectedKeys={editData?.costType ? [editData.costType] : []}
                                onSelectionChange={(keys) => {
                                    const value = Array.from(keys)[0] as "RECURRENT" | "EXCEPTIONAL";
                                    setEditData(prev => prev ? {...prev, costType: value} : null);
                                }}
                                classNames={{label: "text-sm"}}
                            >
                                <SelectItem key="RECURRENT" textValue="Recorrente">
                                    Recorrente (aluguel, contas)
                                </SelectItem>
                                <SelectItem key="EXCEPTIONAL" textValue="Excepcional">
                                    Excepcional (viagens, emergências)
                                </SelectItem>
                            </Select>
                        )}

                        {editData?.type !== "INCOME" && (
                            <Select
                                label="Prioridade"
                                size="sm"
                                selectedKeys={editData?.priority ? [editData.priority] : []}
                                onSelectionChange={(keys) => {
                                    const value = Array.from(keys)[0] as "REQUIRED" | "IMPORTANT" | "OPTIONAL";
                                    setEditData(prev => prev ? {...prev, priority: value} : null);
                                }}
                                classNames={{label: "text-sm"}}
                            >
                                <SelectItem key="REQUIRED" textValue="Obrigatório">
                                    🔴 Obrigatório
                                </SelectItem>
                                <SelectItem key="IMPORTANT" textValue="Importante">
                                    🟡 Importante
                                </SelectItem>
                                <SelectItem key="OPTIONAL" textValue="Opcional">
                                    🟢 Opcional
                                </SelectItem>
                            </Select>
                        )}

                        <Input
                            label="Data"
                            size="sm"
                            type="date"
                            value={editData?.date || ""}
                            onValueChange={(value) => setEditData(prev => prev ? {...prev, date: value} : null)}
                            isRequired
                            classNames={{label: "text-sm"}}
                        />
                    </ModalBody>
                    <ModalFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                        <Button variant="flat" onPress={onEditClose} className="w-full sm:w-auto order-2 sm:order-1">
                            Cancelar
                        </Button>
                        <Button color="primary" onPress={handleUpdate} isLoading={editLoading}
                                className="w-full sm:w-auto order-1 sm:order-2">
                            Salvar Alterações
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </div>
    );
}
