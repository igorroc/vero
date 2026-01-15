import type {Metadata} from "next";
import {EventsList} from "@/components/events";
import {PageHeader} from "@/components/ui";

export const metadata: Metadata = {
    title: "Eventos | Vero",
};

export default function EventsPage() {
    return (
        <>
            <PageHeader title="Eventos" subtitle="Gerencie seus eventos financeiros"/>
            <EventsList/>
        </>
    );
}
