"use client"

import { Button } from "@nextui-org/react"
import { ChevronRight } from "lucide-react"
import Link from "next/link"

export function HomeCallToAction() {
	return (
		<section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-600 to-purple-700">
			<div className="max-w-4xl mx-auto text-center">
				<h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">Pronto para tomar o controle das suas finanças?</h2>
				<p className="text-xl text-blue-100 mb-10">Comece agora mesmo. É gratuito e leva menos de 5 minutos para configurar.</p>
				<div className="flex flex-col sm:flex-row items-center justify-center gap-4">
					<Button as={Link} href="/auth/register" size="lg" className="bg-white text-blue-600 font-semibold px-8 hover:bg-blue-50" endContent={<ChevronRight className="w-5 h-5" />}>
						Criar Conta Grátis
					</Button>
					<Button as={Link} href="/auth/login" variant="bordered" size="lg" className="border-white text-white font-semibold px-8 hover:bg-white/10">
						Já tenho uma conta
					</Button>
				</div>
			</div>
		</section>
	)
}
