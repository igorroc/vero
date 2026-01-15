"use client";

import {Input, Button} from "@nextui-org/react";
import {toast} from "react-toastify";
import {loginAction} from "@/features/auth/login";
import {useState} from "react";
import {Mail, Lock, LogIn} from "lucide-react";

export function LoginForm() {
    const [isLoading, setIsLoading] = useState(false);

    async function loginClient(formData: FormData) {
        setIsLoading(true);
        try {
            const res = await loginAction(formData);

            if (res && "error" in res) {
                toast.error(res.error);
                setIsLoading(false);
            }
        } catch (error) {
            // O redirect() lança uma exceção que é capturada pelo Next.js
        }
    }

    return (
        <form action={loginClient} className="flex flex-col gap-4">
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
                placeholder="Digite sua senha"
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
            <Button
                type="submit"
                color="primary"
                size="lg"
                className="mt-2 font-semibold bg-gradient-to-r from-blue-600 to-purple-600"
                isLoading={isLoading}
                startContent={!isLoading && <LogIn className="w-5 h-5"/>}
            >
                {isLoading ? "Entrando..." : "Entrar"}
            </Button>
        </form>
    );
}
