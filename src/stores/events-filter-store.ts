"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

export type EventsTimeFilter = "all" | "past" | "upcoming" | "today"

interface EventsFilterStore {
	timeFilter: EventsTimeFilter
	setTimeFilter: (timeFilter: EventsTimeFilter) => void
}

export const useEventsFilterStore = create<EventsFilterStore>()(
	persist(
		(set) => ({
			timeFilter: "upcoming",
			setTimeFilter: (timeFilter) => set({ timeFilter }),
		}),
		{ name: "vero-events-filter" },
	),
)
