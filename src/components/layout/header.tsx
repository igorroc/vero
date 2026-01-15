"use client";

import {Bell, Search, User} from "lucide-react";
import {Button, Badge, Avatar, Input} from "@nextui-org/react";

interface HeaderProps {
    title?: string;
    subtitle?: string;
}

export function Header({title, subtitle}: HeaderProps) {
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Bom dia";
        if (hour < 18) return "Boa tarde";
        return "Boa noite";
    };

    return (
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between">
            {/* Left side - Greeting or Title */}
            <div>
                {title ? (
                    <>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                            {title}
                        </h1>
                        {subtitle && (
                            <p className="text-sm text-slate-500">{subtitle}</p>
                        )}
                    </>
                ) : (
                    <>
                        <p className="text-sm text-slate-500">{getGreeting()}</p>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                            Bem-vindo de volta!
                        </h1>
                    </>
                )}
            </div>

            {/* Right side - Search, Notifications, Profile */}
            <div className="flex items-center gap-4">
                {/* Search */}
                <div className="hidden md:block">
                    <Input
                        classNames={{
                            base: "w-64",
                            inputWrapper: "bg-slate-100 dark:bg-slate-800 border-none",
                        }}
                        placeholder="Buscar..."
                        size="sm"
                        startContent={<Search className="w-4 h-4 text-slate-400"/>}
                    />
                </div>

                {/* Notifications */}
                <Badge content="3" color="danger" shape="circle" size="sm">
                    <Button
                        isIconOnly
                        variant="light"
                        className="text-slate-600 dark:text-slate-400"
                    >
                        <Bell className="w-5 h-5"/>
                    </Button>
                </Badge>

                {/* Profile */}
                <Avatar
                    size="sm"
                    src=""
                    fallback={<User className="w-4 h-4"/>}
                    className="bg-gradient-to-br from-blue-500 to-purple-600"
                />
            </div>
        </header>
    );
}
