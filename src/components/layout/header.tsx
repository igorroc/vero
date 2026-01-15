"use client";

import {Bell, LogOut, User} from "lucide-react";
import Link from "next/link";
import {
    Button,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    Avatar,
} from "@nextui-org/react";
import {useRouter} from "next/navigation";
import {logoutAction} from "@/features/auth";

interface HeaderProps {
    userName?: string;
    userEmail?: string;
}

export function Header({userName, userEmail}: HeaderProps) {
    const router = useRouter();

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Bom dia";
        if (hour < 18) return "Boa tarde";
        return "Boa noite";
    };

    const handleLogout = async () => {
        await logoutAction();
        router.push("/auth/login");
    };

    // Get initials from name
    const getInitials = (name?: string) => {
        if (!name) return "U";
        const parts = name.split(" ");
        if (parts.length >= 2) {
            return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    return (
        <header
            className="h-14 sm:h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
            {/* Left side - Logo on mobile, Greeting on desktop */}
            <div className="flex items-center gap-3">
                {/* Mobile: Logo in header */}
                <div className="flex items-center gap-2 md:hidden">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <span className="text-white font-bold text-sm">V</span>
                    </div>
                    <span className="font-bold text-lg text-slate-900 dark:text-white">
                        Vero
                    </span>
                </div>

                {/* Desktop: Greeting */}
                <div className="hidden md:block">
                    <p className="text-sm text-slate-500">{getGreeting()}</p>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                        {userName ? `Olá, ${userName.split(" ")[0]}!` : "Bem-vindo!"}
                    </h1>
                </div>
            </div>

            {/* Right side - Notifications, Profile */}
            <div className="flex items-center gap-2 sm:gap-3">
                {/* Notifications */}
                <Button
                    isIconOnly
                    variant="light"
                    size="sm"
                    className="text-slate-600 dark:text-slate-400 hidden sm:flex"
                    title="Notificações (em breve)"
                >
                    <Bell className="w-5 h-5"/>
                </Button>

                {/* User Dropdown */}
                <Dropdown placement="bottom-end">
                    <DropdownTrigger>
                        <Avatar
                            as="button"
                            size="sm"
                            name={getInitials(userName)}
                            className="bg-gradient-to-br from-blue-500 to-purple-600 text-white cursor-pointer w-8 h-8 sm:w-9 sm:h-9"
                        />
                    </DropdownTrigger>
                    <DropdownMenu aria-label="Menu do usuário">
                        <DropdownItem
                            key="user-info"
                            className="h-14 gap-2"
                            textValue="Informações do usuário"
                            isReadOnly
                        >
                            <p className="font-semibold text-sm sm:text-base">{userName || "Usuário"}</p>
                            <p className="text-xs sm:text-sm text-slate-500">{userEmail || ""}</p>
                        </DropdownItem>
                        <DropdownItem
                            key="profile"
                            as={Link}
                            href="/profile"
                            startContent={<User className="w-4 h-4"/>}
                        >
                            Meu Perfil
                        </DropdownItem>
                        <DropdownItem
                            key="notifications"
                            className="sm:hidden"
                            startContent={<Bell className="w-4 h-4"/>}
                        >
                            Notificações
                        </DropdownItem>
                        <DropdownItem
                            key="logout"
                            color="danger"
                            startContent={<LogOut className="w-4 h-4"/>}
                            onPress={handleLogout}
                        >
                            Sair
                        </DropdownItem>
                    </DropdownMenu>
                </Dropdown>
            </div>
        </header>
    );
}
