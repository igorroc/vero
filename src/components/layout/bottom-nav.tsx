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
		(item) => pathname === item.href,
	)

	return (
		<nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
			{/* Blur background */}
			<div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800" />

			{/* Safe area padding for iOS */}
			<div className="relative flex items-center justify-around px-2 py-2 pb-safe">
				<BottomNavigationItems
					items={bottomMainNavigationItems}
					pathname={pathname}
				/>

				{/* More menu */}
				<Dropdown placement="top">
					<DropdownTrigger>
						<button
							className={`flex flex-col items-center justify-center min-w-[64px] py-1.5 px-3 rounded-xl transition-all ${
								isMoreActive
									? "text-blue-600 dark:text-blue-400"
									: "text-slate-500 dark:text-slate-400"
							}`}
						>
							<div
								className={`p-1.5 rounded-xl transition-all ${
									isMoreActive ? "bg-blue-100 dark:bg-blue-900/40" : ""
								}`}
							>
								<MoreHorizontal
									className={`w-5 h-5 ${isMoreActive ? "stroke-[2.5px]" : ""}`}
								/>
							</div>
							<span
								className={`text-[10px] mt-0.5 font-medium ${
									isMoreActive ? "text-blue-600 dark:text-blue-400" : ""
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
