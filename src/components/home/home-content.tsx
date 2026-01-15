"use client"

import Link from "next/link"
import { Button, Card, CardBody, CardHeader, Chip } from "@nextui-org/react"

export function HomeContent() {
	return (
		<main className="flex min-h-dvh flex-col items-center justify-center p-8 bg-gradient-to-br from-gray-900 to-gray-800">
			<Card className="max-w-2xl w-full">
				<CardHeader className="flex flex-col items-center gap-2 pb-4">
					<h1 className="text-4xl font-bold text-center">
						Vero
					</h1>
					<p className="text-xl text-gray-600 text-center">
						Your Personal Finance Copilot
					</p>
					<Chip color="primary" variant="flat">
						Plan Your Financial Future
					</Chip>
				</CardHeader>
				<CardBody className="gap-4">
					<p className="text-center text-gray-600">
						Stop wondering what you spent. Start knowing what will happen to your money.
						Vero helps you see your financial future, calculate safe daily spending,
						and grow your net worth intentionally.
					</p>

					<div className="grid grid-cols-2 gap-4 mt-4 text-center text-sm">
						<div className="p-3 bg-gray-50 rounded-lg">
							<p className="font-semibold text-blue-600">Daily Spending Limit</p>
							<p className="text-gray-500">Know how much you can safely spend</p>
						</div>
						<div className="p-3 bg-gray-50 rounded-lg">
							<p className="font-semibold text-blue-600">Cashflow Projection</p>
							<p className="text-gray-500">See your money 90 days ahead</p>
						</div>
						<div className="p-3 bg-gray-50 rounded-lg">
							<p className="font-semibold text-blue-600">Investment Planning</p>
							<p className="text-gray-500">Automate wealth building</p>
						</div>
						<div className="p-3 bg-gray-50 rounded-lg">
							<p className="font-semibold text-blue-600">Net Worth Goals</p>
							<p className="text-gray-500">Track progress to your targets</p>
						</div>
					</div>

					<div className="flex flex-col sm:flex-row gap-3 mt-8 justify-center">
						<Button
							as={Link}
							href="/auth/login"
							color="primary"
							variant="shadow"
							size="lg"
						>
							Login
						</Button>
						<Button
							as={Link}
							href="/auth/register"
							color="secondary"
							variant="shadow"
							size="lg"
						>
							Get Started
						</Button>
						<Button
							as={Link}
							href="/dashboard"
							color="default"
							variant="bordered"
							size="lg"
						>
							Dashboard
						</Button>
					</div>
				</CardBody>
			</Card>
		</main>
	)
}
