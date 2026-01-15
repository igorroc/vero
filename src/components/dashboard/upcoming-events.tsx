"use client";

import { Card, CardBody, CardHeader, Chip } from "@nextui-org/react";
import { formatCurrency, type Cents } from "@/types/finance";

interface UpcomingEvent {
  id: string;
  description: string;
  amount: Cents;
  date: Date;
  type: string;
  status: string;
}

interface UpcomingEventsProps {
  events: UpcomingEvent[];
}

export function UpcomingEvents({ events }: UpcomingEventsProps) {
  const formatDate = (date: Date) => {
    const d = new Date(date);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (d.toDateString() === today.toDateString()) {
      return "Today";
    }
    if (d.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    }

    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
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

  return (
    <Card className="w-full">
      <CardHeader className="pb-0">
        <h2 className="text-xl font-semibold">Upcoming Events</h2>
      </CardHeader>
      <CardBody>
        {events.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            No upcoming events in the next 7 days.
          </p>
        ) : (
          <div className="space-y-3">
            {events.map((event) => (
              <div
                key={event.id}
                className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <Chip
                      color={typeColors[event.type] || "default"}
                      size="sm"
                      variant="flat"
                    >
                      {event.type}
                    </Chip>
                    <Chip
                      color={statusColors[event.status] || "default"}
                      size="sm"
                      variant="bordered"
                    >
                      {event.status}
                    </Chip>
                  </div>
                  <span className="font-medium">{event.description}</span>
                  <span className="text-sm text-gray-500">
                    {formatDate(event.date)}
                  </span>
                </div>
                <span
                  className={`font-semibold text-lg ${
                    event.amount > 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {event.amount > 0 ? "+" : ""}
                  {formatCurrency(event.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
