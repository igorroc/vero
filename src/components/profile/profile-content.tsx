"use client";

import {Avatar, Button, Divider} from "@nextui-org/react";
import {User, Mail, Calendar, Shield, LogOut} from "lucide-react";
import {useRouter} from "next/navigation";
import {logoutAction} from "@/features/auth";

type UserType = {
    id: string;
    email: string;
    name: string | null;
    createdAt?: Date;
};

type ProfileContentProps = {
    user: UserType | null;
};

export function ProfileContent({user}: ProfileContentProps) {
    const router = useRouter();

    if (!user) {
        return null;
    }

    const formatDate = (date?: Date) => {
        if (!date) return "N/A";
        return new Date(date).toLocaleDateString("pt-BR", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    const getInitials = (name?: string | null) => {
        if (!name) return "U";
        const parts = name.split(" ");
        if (parts.length >= 2) {
            return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    const handleLogout = async () => {
        await logoutAction();
        router.push("/auth/login");
    };

    return (
        <div className="max-w-2xl space-y-6">
            {/* Profile Card */}
            <div className="modern-card p-6">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                    <Avatar
                        name={getInitials(user.name)}
                        className="w-24 h-24 text-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-white"
                    />
                    <div className="text-center sm:text-left">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                            {user.name || "Usuário"}
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400">{user.email}</p>
                        {user.createdAt && (
                            <p className="text-sm text-slate-400 mt-1">
                                Membro desde {formatDate(user.createdAt)}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Account Info */}
            <div className="modern-card p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                    Informações da Conta
                </h3>

                <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <User className="w-5 h-5 text-blue-600 dark:text-blue-400"/>
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Nome</p>
                            <p className="font-medium text-slate-900 dark:text-white">
                                {user.name || "Não informado"}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                            <Mail className="w-5 h-5 text-purple-600 dark:text-purple-400"/>
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Email</p>
                            <p className="font-medium text-slate-900 dark:text-white">{user.email}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                            <Calendar className="w-5 h-5 text-green-600 dark:text-green-400"/>
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Data de Cadastro</p>
                            <p className="font-medium text-slate-900 dark:text-white">
                                {formatDate(user.createdAt)}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                            <Shield className="w-5 h-5 text-amber-600 dark:text-amber-400"/>
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Status</p>
                            <p className="font-medium text-green-600">Conta Ativa</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="modern-card p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                    Ações da Conta
                </h3>

                <div className="space-y-3">
                    <Button
                        color="danger"
                        variant="flat"
                        className="w-full justify-start"
                        startContent={<LogOut className="w-4 h-4"/>}
                        onPress={handleLogout}
                    >
                        Sair da Conta
                    </Button>
                </div>

                <Divider className="my-4"/>

                <p className="text-xs text-slate-400 text-center">
                    Para alterar suas informações pessoais ou excluir sua conta,
                    entre em contato com o suporte.
                </p>
            </div>
        </div>
    );
}
