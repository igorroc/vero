"use client";

import {LucideIcon} from "lucide-react";

type GradientColor = "blue" | "green" | "red" | "orange" | "purple" | "pink";

interface StatCardProps {
    title: string;
    value: string;
    subtitle?: string;
    icon?: LucideIcon;
    gradient: GradientColor;
    trend?: {
        value: number;
        label: string;
    };
}

const gradientClasses: Record<GradientColor, string> = {
    blue: "bg-gradient-to-br from-blue-500 to-blue-700",
    green: "bg-gradient-to-br from-emerald-500 to-emerald-700",
    red: "bg-gradient-to-br from-red-500 to-red-700",
    orange: "bg-gradient-to-br from-orange-500 to-orange-700",
    purple: "bg-gradient-to-br from-purple-500 to-purple-700",
    pink: "bg-gradient-to-br from-pink-500 to-pink-700",
};

const iconBgClasses: Record<GradientColor, string> = {
    blue: "bg-blue-600/50",
    green: "bg-emerald-600/50",
    red: "bg-red-600/50",
    orange: "bg-orange-600/50",
    purple: "bg-purple-600/50",
    pink: "bg-pink-600/50",
};

export function StatCard({title, value, subtitle, icon: Icon, gradient, trend}: StatCardProps) {
    return (
        <div
            className={`${gradientClasses[gradient]} rounded-2xl p-5 text-white shadow-lg hover-lift cursor-default`}
        >
            <div className="flex justify-between items-start">
                <div className="space-y-1">
                    <p className="text-white/80 text-sm font-medium">{title}</p>
                    <p className="text-3xl font-bold tracking-tight">{value}</p>
                    {subtitle && (
                        <p className="text-white/70 text-xs">{subtitle}</p>
                    )}
                </div>
                {Icon && (
                    <div className={`${iconBgClasses[gradient]} p-3 rounded-xl`}>
                        <Icon className="w-6 h-6"/>
                    </div>
                )}
            </div>
            {trend && (
                <div className="mt-4 pt-3 border-t border-white/20">
                    <span
                        className={`text-sm font-medium ${
                            trend.value >= 0 ? "text-green-200" : "text-red-200"
                        }`}
                    >
                        {trend.value >= 0 ? "+" : ""}
                        {trend.value}%
                    </span>
                    <span className="text-white/60 text-sm ml-2">{trend.label}</span>
                </div>
            )}
        </div>
    );
}
