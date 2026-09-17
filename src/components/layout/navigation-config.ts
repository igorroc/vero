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
	UsersRound,
	BadgeDollarSign,
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
		label: "Gestão inicial",
		items: [
			{ icon: PiggyBank, label: "Contas", href: "/accounts" },
			{ icon: Tags, label: "Categorias", href: "/categories" },
			{ icon: ReceiptText, label: "Orçamentos", href: "/budgets" },
		],
	},
	{
		label: "Acompanhamento",
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
				label: "Por categoria",
				href: "/reports/spending",
			},
			{
				icon: ReceiptText,
				label: "Orçamento mensal",
				href: "/reports/budget",
			},
		],
	},
	{
		label: "Preferências",
		items: [{ icon: Settings, label: "Configurações", href: "/settings" }],
	},
]

export const adminNavigationGroups: NavigationGroup[] = [
	{
		label: "Administração",
		items: [
			{ icon: LayoutDashboard, label: "Dashboard", href: "/admin/dashboard" },
			{ icon: UsersRound, label: "Usuários", href: "/admin/users" },
			{
				icon: BadgeDollarSign,
				label: "Planos e cobrança",
				href: "/admin/plans",
			},
		],
	},
]

export const bottomMainNavigationItems: NavigationItem[] = [
	{ icon: LayoutDashboard, label: "Home", href: "/dashboard" },
	{ icon: Wallet, label: "Lançamentos", href: "/events" },
	{
		icon: ChartNoAxesCombined,
		label: "Gastos",
		href: "/reports/spending",
	},
]

export const bottomMoreNavigationItems: NavigationItem[] = [
	{ icon: PiggyBank, label: "Contas", href: "/accounts" },
	{ icon: Tags, label: "Categorias", href: "/categories" },
	{ icon: ReceiptText, label: "Orçamentos", href: "/budgets" },
	{ icon: TrendingUp, label: "Investimentos", href: "/investments" },
	{ icon: HandCoins, label: "Dívidas", href: "/debts" },
	{ icon: Settings, label: "Configurações", href: "/settings" },
]

export const adminBottomNavigationItems: NavigationItem[] = [
	{ icon: LayoutDashboard, label: "Início", href: "/admin/dashboard" },
	{ icon: UsersRound, label: "Usuários", href: "/admin/users" },
	{ icon: BadgeDollarSign, label: "Planos", href: "/admin/plans" },
]
