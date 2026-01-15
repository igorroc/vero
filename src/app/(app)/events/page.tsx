import type {Metadata} from "next";
import {EventsList} from "@/components/events";

export const metadata: Metadata = {
    title: "Eventos | Vero",
};

export default function EventsPage() {
    return (
        <div className="max-w-3xl mx-auto">
            {/* Mobile-friendly header */}
            <div className="mb-4 sm:mb-6">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                    Eventos
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                    Gerencie seus eventos financeiros
                </p>
            </div>
            <EventsList/>
        </div>
    );
}
