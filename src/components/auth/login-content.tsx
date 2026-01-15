"use client";

import Link from "next/link";
import {LoginForm} from "./login-form";
import {Sparkles} from "lucide-react";

export function LoginContent() {
    return (
        <main className="min-h-dvh flex">
            {/* Left side - Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-purple-700 p-12 flex-col justify-between">
                <div>
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                            <Sparkles className="w-6 h-6 text-white"/>
                        </div>
                        <span className="text-2xl font-bold text-white">Vero</span>
                    </Link>
                </div>

                <div className="space-y-6">
                    <h1 className="text-4xl font-bold text-white leading-tight">
                        Seu copiloto financeiro pessoal
                    </h1>
                    <p className="text-xl text-blue-100">
                        Saiba quanto pode gastar por dia, visualize seu futuro financeiro
                        e tome decisões com confiança.
                    </p>
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                                </svg>
                            </div>
                            <span className="text-blue-100">Projeção de até 90 dias</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                                </svg>
                            </div>
                            <span className="text-blue-100">Limite diário inteligente</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                                </svg>
                            </div>
                            <span className="text-blue-100">100% gratuito</span>
                        </div>
                    </div>
                </div>

                <p className="text-blue-200 text-sm">
                    &copy; {new Date().getFullYear()} Vero. Todos os direitos reservados.
                </p>
            </div>

            {/* Right side - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-slate-50 dark:bg-slate-950">
                <div className="w-full max-w-md">
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex justify-center mb-8">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                                <Sparkles className="w-6 h-6 text-white"/>
                            </div>
                            <span className="text-2xl font-bold text-slate-900 dark:text-white">Vero</span>
                        </Link>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                                Bem-vindo de volta!
                            </h2>
                            <p className="text-slate-500 dark:text-slate-400">
                                Entre com suas credenciais para acessar sua conta
                            </p>
                        </div>

                        <LoginForm/>

                        <div className="mt-6 text-center">
                            <p className="text-slate-500 dark:text-slate-400">
                                Ainda não tem uma conta?{" "}
                                <Link
                                    href="/auth/register"
                                    className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
                                >
                                    Cadastre-se grátis
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
