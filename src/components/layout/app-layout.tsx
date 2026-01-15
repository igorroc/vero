"use client";

import {Sidebar} from "./sidebar";
import {Header} from "./header";

interface AppLayoutProps {
    children: React.ReactNode;
    title?: string;
    subtitle?: string;
    userName?: string;
    userEmail?: string;
}

export function AppLayout({children, title, subtitle, userName, userEmail}: AppLayoutProps) {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            {/* Sidebar */}
            <Sidebar/>

            {/* Main content area */}
            <div className="ml-64 transition-all duration-300">
                {/* Header */}
                <Header
                    title={title}
                    subtitle={subtitle}
                    userName={userName}
                    userEmail={userEmail}
                />

                {/* Page content */}
                <main className="p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
