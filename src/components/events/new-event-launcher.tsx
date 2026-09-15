"use client"

import { Button, useDisclosure } from "@nextui-org/react"
import { Plus } from "lucide-react"
import type { AccountWithBalance } from "@/features/accounts"
import type { CategoryWithGroup } from "@/features/categories"
import { EventForm } from "./event-form"

export type NewEventViewMode = "button" | "bubble"

interface NewEventLauncherProps {
	mode: NewEventViewMode
	accounts: AccountWithBalance[]
	categories: CategoryWithGroup[]
	onSuccess: () => void
}

export function NewEventLauncher({
	mode,
	accounts,
	categories,
	onSuccess,
}: NewEventLauncherProps) {
	const { isOpen, onOpen, onClose } = useDisclosure()

	return (
		<>
			{mode === "button" ? (
				<Button
					color="primary"
					onPress={onOpen}
					radius="full"
					className="w-full sm:w-auto"
					startContent={<Plus className="w-4 h-4" />}
				>
					Novo Lançamento
				</Button>
			) : (
				<Button
					isIconOnly
					aria-label="Novo lançamento"
					color="primary"
					onPress={onOpen}
					radius="full"
					className="fixed bottom-24 right-6 z-50 h-14 w-14 min-w-14 shadow-lg"
				>
					<Plus className="h-6 w-6" />
				</Button>
			)}
			<EventForm
				isOpen={isOpen}
				onClose={onClose}
				onSuccess={onSuccess}
				accounts={accounts}
				categories={categories}
			/>
		</>
	)
}
