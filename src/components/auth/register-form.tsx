"use client";

import {Input, Button} from "@nextui-org/react";
import {toast} from "react-toastify";
import {registerAction} from "@/features/auth/register";
import {useState} from "react";
import {Mail, Lock, User, UserPlus} from "lucide-react";

export function RegisterForm() {
    const [isLoading, setIsLoading] = useState(false);

    async function registerClient(formData: FormData) {
        setIsLoading(true);
        try {
            const res = await registerAction(formData);

            if (res && "error" in res) {
                toast.error(res.error);
                setIsLoading(false);
            }
        } catch (error) {
            // O redirect() lança uma exceção que é capturada pelo Next.js
        }
    }

    return (
        <form action={registerClient} className="flex flex-col gap-4">
            <Input
                type="text"
                label="Nome completo"
                placeholder="Digite seu nome"
                name="name"
                isRequired
                variant="bordered"
                isDisabled={isLoading}
                startContent={<User className="w-4 h-4 text-slate-400"/>}
                classNames={{
                    input: "text-slate-900 dark:text-white",
                    label: "text-slate-600 dark:text-slate-400",
                }}
            />
            <Input
                type="email"
                label="Email"
                placeholder="Digite seu email"
                name="email"
                isRequired
                variant="bordered"
                isDisabled={isLoading}
                startContent={<Mail className="w-4 h-4 text-slate-400"/>}
                classNames={{
                    input: "text-slate-900 dark:text-white",
                    label: "text-slate-600 dark:text-slate-400",
                }}
            />
            <Input
                type="password"
                label="Senha"
                placeholder="Crie uma senha segura"
                name="password"
                isRequired
                variant="bordered"
                isDisabled={isLoading}
                startContent={<Lock className="w-4 h-4 text-slate-400"/>}
                classNames={{
                    input: "text-slate-900 dark:text-white",
                    label: "text-slate-600 dark:text-slate-400",
                }}
            />
            <p className="text-xs text-slate-400">
                A senha deve ter pelo menos 6 caracteres
            </p>
            <Button
                type="submit"
                color="secondary"
                size="lg"
                className="mt-2 font-semibold bg-gradient-to-r from-purple-600 to-blue-600"
                isLoading={isLoading}
                startContent={!isLoading && <UserPlus className="w-5 h-5"/>}
            >
                {isLoading ? "Criando conta..." : "Criar conta"}
            </Button>

            <p className="text-xs text-slate-400 text-center mt-2">
                Ao criar uma conta, você concorda com nossos termos de uso e política de privacidade.
            </p>
        </form>
    );
}
