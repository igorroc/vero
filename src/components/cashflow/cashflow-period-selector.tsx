"use client"

import {
	Button,
	Dropdown,
	DropdownItem,
	DropdownMenu,
	DropdownTrigger,
} from "@nextui-org/react"
import { ChevronDown } from "lucide-react"

interface CashflowPeriodSelectorProps {
	days: number
	onDaysChange: (days: number) => void
}

const periodOptions = [
	{ key: "30", label: "30 Dias" },
	{ key: "60", label: "60 Dias" },
	{ key: "90", label: "90 Dias" },
]

export function CashflowPeriodSelector({
	days,
	onDaysChange,
}: CashflowPeriodSelectorProps) {
	return (
		<>
			<div className="sm:hidden">
				<Dropdown>
					<DropdownTrigger>
						<Button
							variant="flat"
							size="sm"
							className="bg-white/20 text-white min-w-[100px] rounded-xl"
							endContent={<ChevronDown className="w-4 h-4" />}
						>
							{days} Dias
						</Button>
					</DropdownTrigger>
					<DropdownMenu
						aria-label="Período"
						selectedKeys={[days.toString()]}
						onSelectionChange={(keys) => {
							const selected = Array.from(keys)[0]
							if (typeof selected === "string") {
								onDaysChange(Number(selected))
							}
						}}
						selectionMode="single"
					>
						{periodOptions.map((option) => (
							<DropdownItem key={option.key}>{option.label}</DropdownItem>
						))}
					</DropdownMenu>
				</Dropdown>
			</div>

			<div className="hidden sm:flex gap-2">
				{periodOptions.map((option) => (
					<Button
						key={option.key}
						size="sm"
						className={`rounded-xl ${
							days === Number(option.key)
								? "bg-white text-indigo-900 font-medium"
								: "bg-white/20 text-white hover:bg-white/30"
						}`}
						onPress={() => onDaysChange(Number(option.key))}
					>
						{option.label}
					</Button>
				))}
			</div>
		</>
	)
}
