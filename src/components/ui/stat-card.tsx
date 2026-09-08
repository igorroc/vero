"use client"

import { LucideIcon } from "lucide-react"

type StatCardVariant = "default" | "positive" | "warning" | "danger" | "info" | "accent"

interface StatCardProps {
	title: string
	value: string
	subtitle?: string
	icon?: LucideIcon
	variant?: StatCardVariant
	trend?: {
		value: number
		label: string
	}
}

const variantClasses: Record<StatCardVariant, string> = {
	default: "bg-surface border border-border shadow-surface",
	positive: "bg-positive/10 border border-positive/20",
	warning: "bg-warning/10 border border-warning/20",
	danger: "bg-danger/10 border border-danger/20",
	info: "bg-info/10 border border-info/20",
	accent: "bg-accent-muted border border-accent/20",
}

const iconBgClasses: Record<StatCardVariant, string> = {
	default: "bg-surface-muted text-text-secondary",
	positive: "bg-positive/15 text-positive",
	warning: "bg-warning/15 text-warning",
	danger: "bg-danger/15 text-danger",
	info: "bg-info/15 text-info",
	accent: "bg-accent/20 text-primary",
}

export function StatCard({
	title,
	value,
	subtitle,
	icon: Icon,
	variant = "default",
	trend,
}: StatCardProps) {
	return (
		<div
			className={`rounded-card p-5 cursor-default ${variantClasses[variant]}`}
		>
			<div className="flex justify-between items-start">
				<div className="space-y-1">
					<p className="text-text-muted text-sm font-medium">{title}</p>
					<p className="text-3xl font-bold tracking-tight financial-number text-text-primary">
						{value}
					</p>
					{subtitle && (
						<p className="text-text-muted text-xs">{subtitle}</p>
					)}
				</div>
				{Icon && (
					<div className={`${iconBgClasses[variant]} p-3 rounded-control`}>
						<Icon className="w-6 h-6" />
					</div>
				)}
			</div>
			{trend && (
				<div className="mt-4 pt-3 border-t border-current/10">
					<span
						className={`text-sm font-medium financial-number ${
							trend.value >= 0 ? "text-positive" : "text-danger"
						}`}
					>
						{trend.value >= 0 ? "+" : ""}
						{trend.value}%
					</span>
					<span className="text-text-muted text-sm ml-2">{trend.label}</span>
				</div>
			)}
		</div>
	)
}
