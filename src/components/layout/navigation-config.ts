import {
	ChartNoAxesCombined,
	HandCoins,
	LayoutDashboard,
	PiggyBank,
	ReceiptText,
	Settings,
	Tags,
	TrendingUp,
	Wallet,
} from "lucide-react"
import type { ElementType } from "react"

export interface NavigationItem {
	icon: ElementType
	label: string
	href: string
}

export interface NavigationGroup {
	label: string
	items: NavigationItem[]
}

export const sidebarNavigationGroups: NavigationGroup[] = [
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
			{ icon: HandCoins, label: "Dívidas", href: "/debts" },
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

export const bottomMainNavigationItems: NavigationItem[] = [
	{ icon: LayoutDashboard, label: "Home", href: "/dashboard" },
	{ icon: Wallet, label: "Lançamentos", href: "/events" },
	{ icon: ChartNoAxesCombined, label: "Relatórios", href: "/reports/budget" },
]

export const bottomMoreNavigationItems: NavigationItem[] = [
	{ icon: PiggyBank, label: "Contas", href: "/accounts" },
	{ icon: Tags, label: "Categorias", href: "/categories" },
	{ icon: ReceiptText, label: "Orçamentos", href: "/budgets" },
	{ icon: TrendingUp, label: "Investimentos", href: "/investments" },
	{ icon: HandCoins, label: "Dívidas", href: "/debts" },
	{ icon: Settings, label: "Configurações", href: "/settings" },
]
