"use client";

import {LucideIcon} from "lucide-react";

type ColorVariant = "blue" | "green" | "red" | "orange" | "purple" | "pink";

interface ProgressCardProps {
    title: string;
    value: string;
    subtitle?: string;
    progress: number; // 0-100
    icon?: LucideIcon;
    color?: ColorVariant;
}

const progressColors: Record<ColorVariant, string> = {
    blue: "bg-blue-500",
    green: "bg-emerald-500",
    red: "bg-red-500",
    orange: "bg-orange-500",
    purple: "bg-purple-500",
    pink: "bg-pink-500",
};

const iconColors: Record<ColorVariant, string> = {
    blue: "text-blue-500 bg-blue-100",
    green: "text-emerald-500 bg-emerald-100",
    red: "text-red-500 bg-red-100",
    orange: "text-orange-500 bg-orange-100",
    purple: "text-purple-500 bg-purple-100",
    pink: "text-pink-500 bg-pink-100",
};

export function ProgressCard({
    title,
    value,
    subtitle,
    progress,
    icon: Icon,
    color = "blue",
}: ProgressCardProps) {
    const clampedProgress = Math.min(100, Math.max(0, progress));

    return (
        <div className="modern-card p-5">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                        {title}
                    </p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                        {value}
                    </p>
                    {subtitle && (
                        <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
                            {subtitle}
                        </p>
                    )}
                </div>
                {Icon && (
                    <div className={`p-3 rounded-xl ${iconColors[color]}`}>
                        <Icon className="w-5 h-5"/>
                    </div>
                )}
            </div>
            <div className="space-y-2">
                <div className="flex justify-between text-sm">
                    <span className="text-slate-500 dark:text-slate-400">Progresso</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                        {clampedProgress.toFixed(0)}%
                    </span>
                </div>
                <div className="progress-bar">
                    <div
                        className={`progress-bar-fill ${progressColors[color]}`}
                        style={{width: `${clampedProgress}%`}}
                    />
                </div>
            </div>
        </div>
    );
}
