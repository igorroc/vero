"use client"

import { HomeBenefits } from "./home-benefits"
import { HomeCallToAction } from "./home-call-to-action"
import { HomeFeatures } from "./home-features"
import { HomeFooter } from "./home-footer"
import { HomeHero } from "./home-hero"
import { HomeHowItWorks } from "./home-how-it-works"
import { HomeNavigation } from "./home-navigation"
import { HomeProblems } from "./home-problems"

export function HomeContent() {
	return (
		<div className="min-h-screen bg-white dark:bg-slate-950">
			<HomeNavigation />
			<HomeHero />
			<HomeProblems />
			<HomeFeatures />
			<HomeHowItWorks />
			<HomeBenefits />
			<HomeCallToAction />
			<HomeFooter />
		</div>
	)
}
