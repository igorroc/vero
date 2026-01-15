"use client";

import {Sidebar} from "./sidebar";
import {Header} from "./header";
import {useState} from "react";

interface AppLayoutProps {
    children: React.ReactNode;
    title?: string;
    subtitle?: string;
}

export function AppLayout({children, title, subtitle}: AppLayoutProps) {
    const [sidebarCollapsed] = useState(false);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            {/* Sidebar */}
            <Sidebar/>

            {/* Main content area */}
            <div
                className={`transition-all duration-300 ${
                    sidebarCollapsed ? "ml-20" : "ml-64"
                }`}
            >
                {/* Header */}
                <Header title={title} subtitle={subtitle}/>

                {/* Page content */}
                <main className="p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
