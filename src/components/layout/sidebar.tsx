"use client"

import Link from "next/link"
import LogoImage from "@/app/icon.png"
import { usePathname } from "next/navigation"
import {
	LayoutDashboard,
	Wallet,
	TrendingUp,
	Tags,
	PiggyBank,
	Settings,
	ReceiptText,
	ChartNoAxesCombined,
	ChevronLeft,
	ChevronRight,
} from "lucide-react"
import Image from "next/image"

interface NavItem {
	icon: React.ElementType
	label: string
	href: string
}

interface NavGroup {
	label: string
	items: NavItem[]
}

const navGroups: NavGroup[] = [
	{
		label: "Visão geral",
		items: [{ icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" }],
	},
	{
		label: "Configuração inicial",
		items: [
			{ icon: PiggyBank, label: "Contas", href: "/accounts" },
			{ icon: Tags, label: "Categorias", href: "/categories" },
			{ icon: ReceiptText, label: "Orçamentos", href: "/budgets" },
		],
	},
	{
		label: "Acompanhar",
		items: [
			{ icon: Wallet, label: "Lançamentos", href: "/events" },
			{ icon: TrendingUp, label: "Investimentos", href: "/investments" },
		],
	},
	{
		label: "Análise",
		items: [
			{
				icon: ChartNoAxesCombined,
				label: "Relatórios",
				href: "/reports/budget",
			},
		],
	},
	{
		label: "Preferências",
		items: [{ icon: Settings, label: "Configurações", href: "/settings" }],
	},
]

interface SidebarProps {
	collapsed: boolean
	onCollapsedChange: (collapsed: boolean) => void
}

export function Sidebar({ collapsed, onCollapsedChange }: SidebarProps) {
	const pathname = usePathname()

	return (
		<aside
			className={`
                fixed left-0 top-0 h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800
                transition-all duration-300 z-50
                hidden md:block
                ${collapsed ? "w-20" : "w-64"}
            `}
		>
			{/* Logo */}
			<div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800">
				<Link href="/dashboard" className="flex items-center gap-3">
					<div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0">
						<Image src={LogoImage} alt="Vero Logo" />
					</div>
					{!collapsed && (
						<span className="font-bold text-xl text-slate-900 dark:text-white">
							Vero
						</span>
					)}
				</Link>

				{/* Collapse button */}
				<button
					onClick={() => onCollapsedChange(!collapsed)}
					className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
				>
					{collapsed ? (
						<ChevronRight className="w-5 h-5" />
					) : (
						<ChevronLeft className="w-5 h-5" />
					)}
				</button>
			</div>

			{/* Navigation */}
			<nav className="h-[calc(100%-4rem)] space-y-5 overflow-y-auto p-4 pb-28">
				{navGroups.map((group, groupIndex) => (
					<div
						key={group.label}
						className={
							groupIndex > 0
								? "border-t border-slate-200 pt-5 dark:border-slate-800"
								: ""
						}
					>
						{!collapsed && (
							<p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
								{group.label}
							</p>
						)}
						<div className="space-y-1">
							{group.items.map((item) => {
								const isActive = pathname === item.href
								const Icon = item.icon

								return (
									<Link
										key={item.href}
										href={item.href}
										className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
											isActive
												? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/30"
												: "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
										}`}
										title={collapsed ? item.label : undefined}
									>
										<Icon className="w-5 h-5 flex-shrink-0" />
										{!collapsed && (
											<span className="font-medium">{item.label}</span>
										)}
									</Link>
								)
							})}
						</div>
					</div>
				))}
			</nav>

			{/* Bottom section */}
			{!collapsed && (
				<div className="absolute bottom-4 left-4 right-4">
					<div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-800 rounded-xl p-4">
						<p className="text-sm font-medium text-slate-700 dark:text-slate-300">
							Seu Copiloto Financeiro
						</p>
						<p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
							Planeje seu futuro com confiança
						</p>
					</div>
				</div>
			)}
		</aside>
	)
}
