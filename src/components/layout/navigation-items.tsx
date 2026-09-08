"use client"

import { DropdownItem } from "@nextui-org/react"
import Link from "next/link"
import type { NavigationGroup, NavigationItem } from "./navigation-config"

interface SidebarNavigationGroupsProps {
	groups: NavigationGroup[]
	pathname: string
	collapsed: boolean
}

export function SidebarNavigationGroups({
	groups,
	pathname,
	collapsed,
}: SidebarNavigationGroupsProps) {
	return groups.map((group, groupIndex) => (
		<div
			key={group.label}
			className={
				groupIndex > 0
					? "border-t border-slate-200 pt-5 dark:border-slate-800"
					: ""
			}
		>
			{!collapsed && (
				<p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
					{group.label}
				</p>
			)}
			<div className="space-y-1">
				{group.items.map((item) => (
					<SidebarNavigationItem
						key={item.href}
						item={item}
					isActive={pathname === item.href || pathname.startsWith(`${item.href}/`)}
						collapsed={collapsed}
					/>
				))}
			</div>
		</div>
	))
}

interface SidebarNavigationItemProps {
	item: NavigationItem
	isActive: boolean
	collapsed: boolean
}

function SidebarNavigationItem({
	item,
	isActive,
	collapsed,
}: SidebarNavigationItemProps) {
	const Icon = item.icon

	return (
		<Link
			href={item.href}
			aria-current={isActive ? "page" : undefined}
			className={`flex items-center gap-3 px-4 py-3 rounded-control transition-colors duration-200 ${
				isActive
					? "bg-primary text-primary-foreground shadow-surface"
					: "text-text-secondary hover:bg-surface-muted hover:text-text-primary"
			}`}
			title={collapsed ? item.label : undefined}
		>
			<Icon className="w-5 h-5 flex-shrink-0" />
			{!collapsed && <span className="font-medium">{item.label}</span>}
		</Link>
	)
}

interface BottomNavigationItemsProps {
	items: NavigationItem[]
	pathname: string
}

export function BottomNavigationItems({
	items,
	pathname,
}: BottomNavigationItemsProps) {
	return items.map((item) => {
		const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
		const Icon = item.icon

		return (
			<Link
				key={item.href}
				href={item.href}
				aria-current={isActive ? "page" : undefined}
				className={`flex flex-col items-center justify-center min-w-[64px] py-1.5 px-3 rounded-control transition-colors ${
					isActive
						? "text-primary"
						: "text-text-muted"
				}`}
			>
				<div
					className={`rounded-control p-1.5 transition-colors ${
						isActive ? "bg-surface-brand" : ""
					}`}
				>
					<Icon className={`w-5 h-5 ${isActive ? "stroke-[2.5px]" : ""}`} />
				</div>
				<span
					className={`mt-0.5 text-[10px] font-medium ${
						isActive ? "text-primary" : ""
					}`}
				>
					{item.label}
				</span>
			</Link>
		)
	})
}

interface MoreNavigationItemsProps {
	items: NavigationItem[]
	pathname: string
}

export function MoreNavigationItems({ items, pathname }: MoreNavigationItemsProps) {
	return items.map((item) => {
		const Icon = item.icon

		return (
			<DropdownItem
				key={item.href}
				as={Link}
				href={item.href}
				startContent={<Icon className="w-4 h-4" />}
			className={pathname === item.href || pathname.startsWith(`${item.href}/`) ? "text-primary" : ""}
			>
				{item.label}
			</DropdownItem>
		)
	})
}
