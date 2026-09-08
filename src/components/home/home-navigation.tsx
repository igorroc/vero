"use client"

import { Button } from "@nextui-org/react"
import Image from "next/image"
import Link from "next/link"
import LogoImage from "@/app/icon.png"

export function HomeNavigation() {
	return (
		<nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"><div className="flex items-center justify-between h-16">
				<div className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg flex items-center justify-center"><Image src={LogoImage} alt="Vero Logo" /></div><span className="text-xl font-bold text-slate-900 dark:text-white">Vero</span></div>
				<div className="hidden md:flex items-center gap-8"><a href="#features" className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition">Funcionalidades</a><a href="#how-it-works" className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition">Como Funciona</a><a href="#benefits" className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition">Benefícios</a></div>
				<div className="flex items-center gap-3"><Button as={Link} href="/auth/login" variant="light" className="font-medium">Entrar</Button><Button as={Link} href="/auth/register" color="primary" className="font-medium">Criar Conta</Button></div>
			</div></div>
		</nav>
	)
}
