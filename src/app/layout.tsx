import type { Metadata } from "next"
import { Instrument_Sans, Inter } from "next/font/google"
import { ToastContainer } from "react-toastify"

import "./globals.css"
import "react-toastify/dist/ReactToastify.css"
import { Providers } from "./providers"

const inter = Inter({
	subsets: ["latin"],
	variable: "--font-interface",
	display: "swap",
})

const instrumentSans = Instrument_Sans({
	subsets: ["latin"],
	variable: "--font-heading",
	display: "swap",
})

export const metadata: Metadata = {
	title: "Vero - Seu Copiloto Financeiro",
	description:
		"Planeje seu futuro financeiro com confiança. Acompanhe o fluxo de caixa, calcule limites diários de gastos e cresça seu patrimônio.",
	icons: {
		icon: "/favicon.png",
		shortcut: "/favicon.png",
		apple: "/favicon.png",
	},
}

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<html lang="pt-BR">
			<head>
				<meta name="apple-mobile-web-app-title" content="Vero" />
			</head>
			<body className={`${inter.variable} ${instrumentSans.variable} font-sans`}>
				<Providers>
					<ToastContainer />
					{children}
				</Providers>
			</body>
		</html>
	)
}
