"use client"

import { usePathname } from "next/navigation"
import { MoreHorizontal } from "lucide-react"
import { Dropdown, DropdownTrigger, DropdownMenu } from "@nextui-org/react"
import {
	bottomMainNavigationItems,
	bottomMoreNavigationItems,
} from "./navigation-config"
import { BottomNavigationItems, MoreNavigationItems } from "./navigation-items"

export function BottomNav() {
	const pathname = usePathname()

	const isMoreActive = bottomMoreNavigationItems.some(
		(item) =>
			pathname === item.href || pathname.startsWith(`${item.href}/`),
	)

	return (
		<nav aria-label="Navegação" className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
			<div className="absolute inset-0 bg-surface/80 backdrop-blur-lg border-t border-border" />

			<div className="relative flex items-center justify-around px-2 py-2 pb-safe">
				<BottomNavigationItems
					items={bottomMainNavigationItems}
					pathname={pathname}
				/>

				<Dropdown placement="top">
					<DropdownTrigger>
						<button
							className={`flex flex-col items-center justify-center min-w-[64px] py-1.5 px-3 rounded-control transition-colors ${
								isMoreActive ? "text-primary" : "text-text-muted"
							}`}
						>
							<div
								className={`rounded-control p-1.5 transition-colors ${
									isMoreActive ? "bg-surface-brand" : ""
								}`}
							>
								<MoreHorizontal
									className={`w-5 h-5 ${isMoreActive ? "stroke-[2.5px]" : ""}`}
								/>
							</div>
							<span
								className={`mt-0.5 text-[10px] font-medium ${
									isMoreActive ? "text-primary" : ""
								}`}
							>
								Mais
							</span>
						</button>
					</DropdownTrigger>
					<DropdownMenu aria-label="Mais opções">
						<MoreNavigationItems
							items={bottomMoreNavigationItems}
							pathname={pathname}
						/>
					</DropdownMenu>
				</Dropdown>
			</div>
		</nav>
	)
}
