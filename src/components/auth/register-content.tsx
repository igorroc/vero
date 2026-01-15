"use client";

import Link from "next/link";
import {RegisterForm} from "./register-form";
import {Sparkles} from "lucide-react";
import Image from "next/image";
import LogoImage from "@/app/icon.png";

export function RegisterContent() {
    return (
        <main className="min-h-dvh flex">
            {/* Left side - Branding */}
            <div
                className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-purple-600 to-blue-700 p-12 flex-col justify-between">
                <div>
                    <Link href="/" className="flex items-center gap-2">
                        <div
                            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0">
                            <Image src={LogoImage} alt="Vero Logo"/>
                        </div>
                        <span className="text-2xl font-bold text-white">Vero</span>
                    </Link>
                </div>

                <div className="space-y-6">
                    <h1 className="text-4xl font-bold text-white leading-tight">
                        Comece sua jornada financeira hoje
                    </h1>
                    <p className="text-xl text-purple-100">
                        Crie sua conta em segundos e descubra quanto você pode gastar
                        por dia com segurança.
                    </p>
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor"
                                     viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                          d="M5 13l4 4L19 7"/>
                                </svg>
                            </div>
                            <span className="text-purple-100">Configuração em menos de 5 minutos</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor"
                                     viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                          d="M5 13l4 4L19 7"/>
                                </svg>
                            </div>
                            <span className="text-purple-100">Sem cartão de crédito necessário</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor"
                                     viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                          d="M5 13l4 4L19 7"/>
                                </svg>
                            </div>
                            <span className="text-purple-100">Seus dados sempre seguros</span>
                        </div>
                    </div>
                </div>

                <p className="text-purple-200 text-sm">
                    &copy; {new Date().getFullYear()} Vero. Todos os direitos reservados.
                </p>
            </div>

            {/* Right side - Register Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-slate-50 dark:bg-slate-950">
                <div className="w-full max-w-md">
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex justify-center mb-8">
                        <Link href="/" className="flex items-center gap-2">
                            <div
                                className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center">
                                <Sparkles className="w-6 h-6 text-white"/>
                            </div>
                            <span className="text-2xl font-bold text-slate-900 dark:text-white">Vero</span>
                        </Link>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                                Crie sua conta grátis
                            </h2>
                            <p className="text-slate-500 dark:text-slate-400">
                                Preencha os dados abaixo para começar
                            </p>
                        </div>

                        <RegisterForm/>

                        <div className="mt-6 text-center">
                            <p className="text-slate-500 dark:text-slate-400">
                                Já tem uma conta?{" "}
                                <Link
                                    href="/auth/login"
                                    className="text-purple-600 hover:text-purple-700 font-medium hover:underline"
                                >
                                    Faça login
                                </Link>
                            </p>
                        </div>
                    </div>

                    <p className="text-center text-slate-400 text-sm mt-6 lg:hidden">
                        &copy; {new Date().getFullYear()} Vero. Todos os direitos reservados.
                    </p>
                </div>
            </div>
        </main>
    );
}
