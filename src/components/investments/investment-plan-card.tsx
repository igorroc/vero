"use client"

import {
	Button,
	Chip,
	Dropdown,
	DropdownItem,
	DropdownMenu,
	DropdownTrigger,
} from "@nextui-org/react"
import { MoreVertical } from "lucide-react"
import { formatCurrency } from "@/types/finance"
import type { InvestmentPlanWithAccount } from "./investment-plan-types"

interface InvestmentPlanCardProps {
	plan: InvestmentPlanWithAccount
	getFrequencyLabel: (frequency: string) => string
	onToggleActive: (plan: InvestmentPlanWithAccount) => void
	onDelete: (planId: string) => void
}

export function InvestmentPlanCard({
	plan,
	getFrequencyLabel,
	onToggleActive,
	onDelete,
}: InvestmentPlanCardProps) {
	return (
		<div className={`modern-card p-4 ${!plan.isActive ? "opacity-60" : ""}`}>
			<div className="flex items-center justify-between">
				<div className="space-y-1">
					<div className="flex items-center gap-2">
						<span className="text-lg font-semibold text-slate-900 dark:text-white">
							{plan.name}
						</span>
						{!plan.isActive && (
							<Chip size="sm" variant="flat">
								Pausado
							</Chip>
						)}
					</div>
					<div className="flex items-center gap-2 text-sm text-slate-500">
						<span>{plan.account.name}</span>
						<span>|</span>
						<span>{getFrequencyLabel(plan.frequency)}</span>
						<span>|</span>
						<span>Dia {plan.dayOfExecution}</span>
					</div>
				</div>
				<div className="flex items-center gap-4">
					<div className="text-right">
						<p className="text-xl font-bold text-purple-600">
							{formatCurrency(plan.amount)}
						</p>
						<p className="text-xs text-slate-500">
							por {getFrequencyLabel(plan.frequency).toLowerCase()}
						</p>
					</div>
					<Dropdown>
						<DropdownTrigger>
							<Button
								isIconOnly
								variant="light"
								size="sm"
								aria-label={`Ações de ${plan.name}`}
							>
								<MoreVertical className="h-4 w-4" />
							</Button>
						</DropdownTrigger>
						<DropdownMenu aria-label={`Ações do plano ${plan.name}`}>
							<DropdownItem key="toggle" onPress={() => onToggleActive(plan)}>
								{plan.isActive ? "Pausar" : "Ativar"}
							</DropdownItem>
							<DropdownItem
								key="delete"
								className="text-danger"
								color="danger"
								onPress={() => onDelete(plan.id)}
							>
								Excluir
							</DropdownItem>
						</DropdownMenu>
					</Dropdown>
				</div>
			</div>
		</div>
	)
}
