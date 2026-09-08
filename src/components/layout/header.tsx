"use client"

import { Bell, LogOut, User } from "lucide-react"
import Link from "next/link"
import {
	Button,
	Dropdown,
	DropdownTrigger,
	DropdownMenu,
	DropdownItem,
	Avatar,
} from "@nextui-org/react"
import { useRouter } from "next/navigation"
import { logoutAction } from "@/features/auth"
import Image from "next/image"
import LogoImage from "@/app/icon.png"
import { formatCurrency, type Cents } from "@/types/finance"
import type { AccountType } from "@prisma/client"

export interface HeaderAccountBalance {
	id: string
	name: string
	type: AccountType
	currentBalance: Cents
}

interface HeaderProps {
	userName?: string
	userEmail?: string
	accounts: HeaderAccountBalance[]
}

export function Header({ userName, userEmail, accounts }: HeaderProps) {
	const router = useRouter()
	const visibleAccounts = accounts
		.filter((account) => account.currentBalance !== 0)
		.sort((a, b) => b.currentBalance - a.currentBalance)
	const liquidAccounts = visibleAccounts.filter(
		(account) => account.type !== "INVESTMENT",
	)
	const investmentAccounts = visibleAccounts.filter(
		(account) => account.type === "INVESTMENT",
	)

	const getGreeting = () => {
		const hour = new Date().getHours()
		if (hour < 12) return "Bom dia"
		if (hour < 18) return "Boa tarde"
		return "Boa noite"
	}

	const handleLogout = async () => {
		await logoutAction()
		router.push("/auth/login")
	}

	const getInitials = (name?: string) => {
		if (!name) return "U"
		const parts = name.split(" ")
		if (parts.length >= 2) {
			return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
		}
		return name.substring(0, 2).toUpperCase()
	}

	return (
		<header className="h-14 sm:h-16 bg-surface border-b border-border px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
			<div className="flex items-center gap-3">
				<div className="flex items-center gap-2 md:hidden">
					<div className="w-8 h-8 rounded-control flex items-center justify-center flex-shrink-0">
						<Image src={LogoImage} alt="Vero Logo" />
					</div>
					<span className="font-bold text-lg font-heading text-text-primary">
						Vero
					</span>
				</div>

				<div className="hidden md:block">
					<p className="text-sm text-text-muted">{getGreeting()}</p>
					<h1 className="text-xl font-bold font-heading text-text-primary">
						{userName ? `Olá, ${userName.split(" ")[0]}!` : "Bem-vindo!"}
					</h1>
				</div>
			</div>

			<div className="hidden md:flex flex-1 min-w-0 justify-end px-6">
				{visibleAccounts.length > 0 && (
					<div className="flex max-w-full items-center gap-2 overflow-x-auto py-1">
						{liquidAccounts.length > 0 && (
							<HeaderAccountGroup tone="liquid" accounts={liquidAccounts} />
						)}
						{investmentAccounts.length > 0 && (
							<HeaderAccountGroup
								tone="investment"
								accounts={investmentAccounts}
							/>
						)}
					</div>
				)}
			</div>

			<div className="flex items-center gap-2 sm:gap-3">
				<Button
					isIconOnly
					variant="light"
					size="sm"
					aria-label="Notificações (em breve)"
					className="text-text-muted hidden sm:flex"
					title="Notificações (em breve)"
				>
					<Bell className="w-5 h-5" />
				</Button>

				<Dropdown placement="bottom-end">
					<DropdownTrigger>
						<Avatar
							as="button"
							size="sm"
							name={getInitials(userName)}
							className="bg-primary text-primary-foreground cursor-pointer w-8 h-8 sm:w-9 sm:h-9"
						/>
					</DropdownTrigger>
					<DropdownMenu aria-label="Menu do usuário">
						<DropdownItem
							key="user-info"
							className="h-14 gap-2"
							textValue="Informações do usuário"
							isReadOnly
						>
							<p className="font-semibold text-sm sm:text-base">
								{userName || "Usuário"}
							</p>
							<p className="text-xs sm:text-sm text-text-muted">
								{userEmail || ""}
							</p>
						</DropdownItem>
						<DropdownItem
							key="profile"
							as={Link}
							href="/profile"
							startContent={<User className="w-4 h-4" />}
						>
							Meu Perfil
						</DropdownItem>
						<DropdownItem
							key="notifications"
							className="sm:hidden"
							startContent={<Bell className="w-4 h-4" />}
						>
							Notificações
						</DropdownItem>
						<DropdownItem
							key="logout"
							color="danger"
							startContent={<LogOut className="w-4 h-4" />}
							onPress={handleLogout}
						>
							Sair
						</DropdownItem>
					</DropdownMenu>
				</Dropdown>
			</div>
		</header>
	)
}

function HeaderAccountGroup({
	tone,
	accounts,
}: {
	tone: "liquid" | "investment"
	accounts: HeaderAccountBalance[]
}) {
	const cardColors =
		tone === "liquid"
			? "border-accent-muted border-l-accent bg-surface-brand/50 hover:bg-surface-brand transition-colors"
			: "border-info/20 border-l-info/40 bg-info/5 hover:bg-info/10 transition-colors"

	return (
		<div className="flex items-center gap-2">
			{accounts.map((account) => (
				<Link
					key={account.id}
					href={`/accounts/${account.id}`}
					className={`shrink-0 rounded-control border border-l-2 px-2.5 py-1 ${cardColors}`}
				>
					<p
						className="max-w-28 truncate text-xs text-text-muted"
						title={account.name}
					>
						{account.name}
					</p>
					<p
						className={`text-sm font-semibold financial-number ${
							account.currentBalance < 0
								? "text-danger"
								: "text-text-primary"
						}`}
					>
						{formatCurrency(account.currentBalance)}
					</p>
				</Link>
			))}
		</div>
	)
}
