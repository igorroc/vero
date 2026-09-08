import Image from "next/image"
import Link from "next/link"
import LogoImage from "@/app/icon.png"

export function HomeFooter() {
	return (
		<footer className="py-12 px-4 sm:px-6 lg:px-8 bg-slate-900"><div className="max-w-7xl mx-auto"><div className="flex flex-col md:flex-row items-center justify-between gap-6"><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg flex items-center justify-center"><Image src={LogoImage} alt="Vero Logo" /></div><span className="text-xl font-bold text-white">Vero</span></div><p className="text-slate-400 text-center">Vero - Seu copiloto financeiro pessoal. Planeje seu futuro com confiança.</p><div className="flex items-center gap-6"><Link href="/auth/login" className="text-slate-400 hover:text-white transition">Entrar</Link><Link href="/auth/register" className="text-slate-400 hover:text-white transition">Criar Conta</Link></div></div><div className="mt-8 pt-8 border-t border-slate-800 text-center text-slate-500 text-sm">&copy; {new Date().getFullYear()} Vero. Todos os direitos reservados.</div></div></footer>
	)
}
