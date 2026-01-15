import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ToastContainer } from "react-toastify"

import "./globals.css"
import "react-toastify/dist/ReactToastify.css"
import { Providers } from "./providers"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
	title: "Vero - Seu Copiloto Financeiro",
	description: "Planeje seu futuro financeiro com confiança. Acompanhe o fluxo de caixa, calcule limites diários de gastos e cresça seu patrimônio.",
}

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<html lang="pt-BR">
			<body className={inter.className}>
				<Providers>
					<ToastContainer />
					{children}
				</Providers>
			</body>
		</html>
	)
}
