"use client";

import Link from "next/link";
import {usePathname} from "next/navigation";
import {
    LayoutDashboard,
    Wallet,
    CalendarDays,
    TrendingUp,
    PiggyBank,
    Settings,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import {useState} from "react";

interface NavItem {
    icon: React.ElementType;
    label: string;
    href: string;
}

const navItems: NavItem[] = [
    {icon: LayoutDashboard, label: "Dashboard", href: "/dashboard"},
    {icon: CalendarDays, label: "Fluxo de Caixa", href: "/cashflow"},
    {icon: Wallet, label: "Eventos", href: "/events"},
    {icon: PiggyBank, label: "Contas", href: "/accounts"},
    {icon: TrendingUp, label: "Investimentos", href: "/investments"},
    {icon: Settings, label: "Configurações", href: "/settings"},
];

export function Sidebar() {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);

    return (
        <aside
            className={`fixed left-0 top-0 h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 z-50 ${
                collapsed ? "w-20" : "w-64"
            }`}
        >
            {/* Logo */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800">
                <Link href="/dashboard" className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <span className="text-white font-bold text-xl">V</span>
                    </div>
                    {!collapsed && (
                        <span className="font-bold text-xl text-slate-900 dark:text-white">
                            Vero
                        </span>
                    )}
                </Link>
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                >
                    {collapsed ? (
                        <ChevronRight className="w-5 h-5"/>
                    ) : (
                        <ChevronLeft className="w-5 h-5"/>
                    )}
                </button>
            </div>

            {/* Navigation */}
            <nav className="p-4 space-y-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                                isActive
                                    ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/30"
                                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                            }`}
                        >
                            <Icon className="w-5 h-5 flex-shrink-0"/>
                            {!collapsed && (
                                <span className="font-medium">{item.label}</span>
                            )}
                        </Link>
                    );
                })}
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
    );
}
