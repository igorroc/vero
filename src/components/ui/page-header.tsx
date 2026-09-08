"use client"

interface PageHeaderProps {
	title: string
	subtitle?: string
	eyebrow?: string
	action?: React.ReactNode
}

export function PageHeader({ title, subtitle, eyebrow, action }: PageHeaderProps) {
	return (
		<div className="mb-6">
			{eyebrow && (
				<p className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-2">
					{eyebrow}
				</p>
			)}
			<div className="flex items-start justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold font-heading text-text-primary">
						{title}
					</h1>
					{subtitle && (
						<p className="text-text-muted mt-1">{subtitle}</p>
					)}
				</div>
				{action && <div className="flex-shrink-0">{action}</div>}
			</div>
		</div>
	)
}
