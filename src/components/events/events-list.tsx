"use client";

import {useEffect, useState} from "react";
import {
    Card,
    CardBody,
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
import {getEvents, confirmEvent, skipEvent, deleteEvent} from "@/features/events";
import {getAccountBalances, type AccountWithBalance} from "@/features/accounts";
import {formatCurrency} from "@/types/finance";
import type {Event} from "@prisma/client";
import {toast} from "react-toastify";
import {EventForm} from "./event-form";

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

        let startDate: Date | undefined;
        let endDate: Date | undefined;

        switch (timeFilter) {
            case "past":
                endDate = new Date(today);
                endDate.setDate(endDate.getDate() - 1);
                break;
            case "today":
                startDate = today;
                endDate = today;
                break;
            case "upcoming":
                startDate = today;
                break;
            case "all":
            default:
                break;
        }

        const result = await getEvents({startDate, endDate});

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
            toast.success("Event confirmed");
            loadData();
        } else {
            toast.error(result.error);
        }
    };

    const handleSkip = async (eventId: string) => {
        const result = await skipEvent(eventId);
        if (result.success) {
            toast.success("Event skipped");
            loadData();
        } else {
            toast.error(result.error);
        }
    };

    const handleDelete = async (eventId: string) => {
        if (!confirm("Are you sure you want to delete this event?")) return;

        const result = await deleteEvent(eventId);
        if (result.success) {
            toast.success("Event deleted");
            loadData();
        } else {
            toast.error(result.error);
        }
    };

    const formatDate = (date: Date) => {
        const d = new Date(date);
        return d.toLocaleDateString("en-US", {
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

    const statusColors: Record<string, "default" | "success" | "warning"> = {
        PLANNED: "warning",
        CONFIRMED: "success",
        SKIPPED: "default",
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Spinner size="lg" label="Loading events..."/>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Events</h1>
                    <p className="text-gray-500">Manage your financial events</p>
                </div>
                <Button color="primary" onPress={onOpen}>
                    Add Event
                </Button>
            </div>

            {/* Filters */}
            <ButtonGroup>
                <Button
                    color={timeFilter === "all" ? "primary" : "default"}
                    variant={timeFilter === "all" ? "solid" : "bordered"}
                    onPress={() => setTimeFilter("all")}
                >
                    All
                </Button>
                <Button
                    color={timeFilter === "past" ? "primary" : "default"}
                    variant={timeFilter === "past" ? "solid" : "bordered"}
                    onPress={() => setTimeFilter("past")}
                >
                    Past
                </Button>
                <Button
                    color={timeFilter === "today" ? "primary" : "default"}
                    variant={timeFilter === "today" ? "solid" : "bordered"}
                    onPress={() => setTimeFilter("today")}
                >
                    Today
                </Button>
                <Button
                    color={timeFilter === "upcoming" ? "primary" : "default"}
                    variant={timeFilter === "upcoming" ? "solid" : "bordered"}
                    onPress={() => setTimeFilter("upcoming")}
                >
                    Upcoming
                </Button>
            </ButtonGroup>

            {/* Events list */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-600">{error}</p>
                    <Button color="primary" size="sm" className="mt-2" onPress={loadData}>
                        Retry
                    </Button>
                </div>
            )}

            {!error && events.length === 0 && (
                <Card>
                    <CardBody className="text-center py-8">
                        <p className="text-gray-500">No events found.</p>
                        <Button color="primary" className="mt-4" onPress={onOpen}>
                            Create your first event
                        </Button>
                    </CardBody>
                </Card>
            )}

            {!error && events.length > 0 && (
                <Card>
                    <CardBody className="p-0">
                        <div className="divide-y">
                            {events.map((event) => (
                                <div
                                    key={event.id}
                                    className={`flex justify-between items-center p-4 ${
                                        isPast(event.date) && event.status === "PLANNED"
                                            ? "bg-yellow-50"
                                            : ""
                                    }`}
                                >
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            <Chip
                                                color={typeColors[event.type]}
                                                size="sm"
                                                variant="flat"
                                            >
                                                {event.type}
                                            </Chip>
                                            <Chip
                                                color={statusColors[event.status]}
                                                size="sm"
                                                variant="bordered"
                                            >
                                                {event.status}
                                            </Chip>
                                            {event.costType && (
                                                <Chip size="sm" variant="dot">
                                                    {event.costType}
                                                </Chip>
                                            )}
                                            {event.isRecurrenceTemplate && (
                                                <Chip size="sm" color="secondary" variant="flat">
                                                    Recurring
                                                </Chip>
                                            )}
                                        </div>
                                        <span className="font-medium text-lg">
                      {event.description}
                    </span>
                                        <span
                                            className={`text-sm ${
                                                isToday(event.date)
                                                    ? "text-blue-600 font-medium"
                                                    : "text-gray-500"
                                            }`}
                                        >
                      {isToday(event.date) ? "Today" : formatDate(event.date)}
                                            {isPast(event.date) && event.status === "PLANNED" && (
                                                <span className="text-yellow-600 ml-2">(Overdue)</span>
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
                                                    ...
                                                </Button>
                                            </DropdownTrigger>
                                            <DropdownMenu
                                                aria-label="Event actions"
                                                onAction={(key) => {
                                                    if (key === "confirm") handleConfirm(event.id);
                                                    if (key === "skip") handleSkip(event.id);
                                                    if (key === "delete") handleDelete(event.id);
                                                }}
                                            >
                                                {event.status === "PLANNED" ? (
                                                    <DropdownItem key="confirm">Confirm</DropdownItem>
                                                ) : null}
                                                {event.status === "PLANNED" ? (
                                                    <DropdownItem key="skip">Skip</DropdownItem>
                                                ) : null}
                                                <DropdownItem
                                                    key="delete"
                                                    className="text-danger"
                                                    color="danger"
                                                >
                                                    Delete
                                                </DropdownItem>
                                            </DropdownMenu>
                                        </Dropdown>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardBody>
                </Card>
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
