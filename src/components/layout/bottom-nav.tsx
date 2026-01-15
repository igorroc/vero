"use client";

import Link from "next/link";
import {usePathname} from "next/navigation";
import {
    LayoutDashboard,
    Wallet,
    CalendarDays,
    PiggyBank,
    MoreHorizontal,
    TrendingUp,
    Settings,
} from "lucide-react";
import {
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
} from "@nextui-org/react";

interface NavItem {
    icon: React.ElementType;
    label: string;
    href: string;
}

const mainNavItems: NavItem[] = [
    {icon: LayoutDashboard, label: "Home", href: "/dashboard"},
    {icon: CalendarDays, label: "Fluxo", href: "/cashflow"},
    {icon: Wallet, label: "Eventos", href: "/events"},
    {icon: PiggyBank, label: "Contas", href: "/accounts"},
];

const moreNavItems: NavItem[] = [
    {icon: TrendingUp, label: "Investimentos", href: "/investments"},
    {icon: Settings, label: "Configurações", href: "/settings"},
];

export function BottomNav() {
    const pathname = usePathname();

    const isMoreActive = moreNavItems.some(item => pathname === item.href);

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
            {/* Blur background */}
            <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800" />

            {/* Safe area padding for iOS */}
            <div className="relative flex items-center justify-around px-2 py-2 pb-safe">
                {mainNavItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex flex-col items-center justify-center min-w-[64px] py-1.5 px-3 rounded-xl transition-all ${
                                isActive
                                    ? "text-blue-600 dark:text-blue-400"
                                    : "text-slate-500 dark:text-slate-400"
                            }`}
                        >
                            <div className={`p-1.5 rounded-xl transition-all ${
                                isActive
                                    ? "bg-blue-100 dark:bg-blue-900/40"
                                    : ""
                            }`}>
                                <Icon className={`w-5 h-5 ${isActive ? "stroke-[2.5px]" : ""}`} />
                            </div>
                            <span className={`text-[10px] mt-0.5 font-medium ${
                                isActive ? "text-blue-600 dark:text-blue-400" : ""
                            }`}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}

                {/* More menu */}
                <Dropdown placement="top">
                    <DropdownTrigger>
                        <button
                            className={`flex flex-col items-center justify-center min-w-[64px] py-1.5 px-3 rounded-xl transition-all ${
                                isMoreActive
                                    ? "text-blue-600 dark:text-blue-400"
                                    : "text-slate-500 dark:text-slate-400"
                            }`}
                        >
                            <div className={`p-1.5 rounded-xl transition-all ${
                                isMoreActive
                                    ? "bg-blue-100 dark:bg-blue-900/40"
                                    : ""
                            }`}>
                                <MoreHorizontal className={`w-5 h-5 ${isMoreActive ? "stroke-[2.5px]" : ""}`} />
                            </div>
                            <span className={`text-[10px] mt-0.5 font-medium ${
                                isMoreActive ? "text-blue-600 dark:text-blue-400" : ""
                            }`}>
                                Mais
                            </span>
                        </button>
                    </DropdownTrigger>
                    <DropdownMenu aria-label="Mais opções">
                        {moreNavItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <DropdownItem
                                    key={item.href}
                                    as={Link}
                                    href={item.href}
                                    startContent={<Icon className="w-4 h-4" />}
                                    className={pathname === item.href ? "text-blue-600" : ""}
                                >
                                    {item.label}
                                </DropdownItem>
                            );
                        })}
                    </DropdownMenu>
                </Dropdown>
            </div>
        </nav>
    );
}
