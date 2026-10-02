"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

export type EventsStatusFilter = "all" | "pending" | "confirmed"

/** Id de categoria selecionada ou "all" para todas. */
export type EventsCategoryFilter = string

interface EventsFilterStore {
	statusFilter: EventsStatusFilter
	categoryFilter: EventsCategoryFilter
	setStatusFilter: (statusFilter: EventsStatusFilter) => void
	setCategoryFilter: (categoryFilter: EventsCategoryFilter) => void
}

export const useEventsFilterStore = create<EventsFilterStore>()(
	persist(
		(set) => ({
			statusFilter: "pending",
			categoryFilter: "all",
			setStatusFilter: (statusFilter) => set({ statusFilter }),
			setCategoryFilter: (categoryFilter) => set({ categoryFilter }),
		}),
		{ name: "vero-events-status-filter" },
	),
)
