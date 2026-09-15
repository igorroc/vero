"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import { formatDateInput } from "@/types/finance"

export interface EventFormData {
	accountId: string
	destinationAccountId: string
	categoryId: string
	description: string
	amount: string
	type: "INCOME" | "EXPENSE" | "INVESTMENT" | "TRANSFER"
	priority: "REQUIRED" | "IMPORTANT" | "OPTIONAL"
	date: string
}

const initialFormData: EventFormData = {
	accountId: "",
	destinationAccountId: "",
	categoryId: "",
	description: "",
	amount: "",
	type: "EXPENSE",
	priority: "IMPORTANT",
	date: formatDateInput(new Date()),
}

interface EventFormStore {
	formData: EventFormData
	setFormData: (formData: EventFormData) => void
}

export const useEventFormStore = create<EventFormStore>()(
	persist(
		(set) => ({
			formData: initialFormData,
			setFormData: (formData) => set({ formData }),
		}),
		{
			name: "vero-event-form",
			partialize: (state) => ({
				formData: {
					...state.formData,
					description: "",
					amount: "",
				},
			}),
		},
	),
)
