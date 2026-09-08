"use client"

import Link from "next/link"
import LogoImage from "@/app/icon.png"
import { usePathname } from "next/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"
import Image from "next/image"
import { sidebarNavigationGroups } from "./navigation-config"
import { SidebarNavigationGroups } from "./navigation-items"

interface SidebarProps {
	collapsed: boolean
	onCollapsedChange: (collapsed: boolean) => void
}

export function Sidebar({ collapsed, onCollapsedChange }: SidebarProps) {
	const pathname = usePathname()

	return (
		<aside
			className={`
				fixed left-0 top-0 h-full bg-surface border-r border-border
				transition-all duration-300 z-50
				hidden md:block
				${collapsed ? "w-20" : "w-64"}
			`}
		>
			<div className="h-16 flex items-center justify-between px-4 border-b border-border">
				<Link href="/dashboard" className="flex items-center gap-3">
					<div className="w-8 h-8 rounded-control flex items-center justify-center flex-shrink-0">
						<Image src={LogoImage} alt="Vero Logo" />
					</div>
					{!collapsed && (
						<span className="font-bold text-xl font-heading text-text-primary">
							Vero
						</span>
					)}
				</Link>

				<button
					onClick={() => onCollapsedChange(!collapsed)}
					aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
					className="p-2 rounded-control hover:bg-surface-muted text-text-muted transition-colors"
				>
					{collapsed ? (
						<ChevronRight className="w-5 h-5" />
					) : (
						<ChevronLeft className="w-5 h-5" />
					)}
				</button>
			</div>

			<nav
				aria-label="Navegação principal"
				className="h-[calc(100%-4rem)] space-y-5 overflow-y-auto p-4 pb-28"
			>
				<SidebarNavigationGroups
					groups={sidebarNavigationGroups}
					pathname={pathname}
					collapsed={collapsed}
				/>
			</nav>
		</aside>
	)
}
