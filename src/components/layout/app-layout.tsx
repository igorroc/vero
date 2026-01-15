"use client";

import {useState, useEffect} from "react";
import {Sidebar} from "./sidebar";
import {Header} from "./header";
import {BottomNav} from "./bottom-nav";

interface AppLayoutProps {
    children: React.ReactNode;
    userName?: string;
    userEmail?: string;
}

export function AppLayout({children, userName, userEmail}: AppLayoutProps) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            {/* Sidebar - only visible on desktop */}
            <Sidebar
                collapsed={sidebarCollapsed}
                onCollapsedChange={setSidebarCollapsed}
            />

            {/* Main content area */}
            <div className={`transition-all duration-300 ${
                sidebarCollapsed ? "md:ml-20" : "md:ml-64"
            }`}>
                {/* Header */}
                <Header
                    userName={userName}
                    userEmail={userEmail}
                />

                {/* Page content - extra bottom padding on mobile for bottom nav */}
                <main className="p-4 sm:p-6 pb-24 md:pb-6">
                    {children}
                </main>
            </div>

            {/* Bottom navigation - only visible on mobile */}
            <BottomNav />
        </div>
    );
}
