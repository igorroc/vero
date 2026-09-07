"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

export type EventsStatusFilter = "all" | "pending" | "confirmed"

interface EventsFilterStore {
	statusFilter: EventsStatusFilter
	setStatusFilter: (statusFilter: EventsStatusFilter) => void
}

export const useEventsFilterStore = create<EventsFilterStore>()(
	persist(
		(set) => ({
			statusFilter: "pending",
			setStatusFilter: (statusFilter) => set({ statusFilter }),
		}),
		{ name: "vero-events-status-filter" },
	),
)
