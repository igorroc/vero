import type { Config } from "tailwindcss"
import { nextui } from "@nextui-org/react"

const config: Config = {
	content: [
		"./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/components/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/app/**/*.{js,ts,jsx,tsx,mdx}",
		"./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}",
	],
	theme: {
		extend: {
			colors: {
				background: "rgb(var(--color-background) / <alpha-value>)",
				foreground: "rgb(var(--color-foreground) / <alpha-value>)",
				surface: "rgb(var(--color-surface) / <alpha-value>)",
				"surface-muted": "rgb(var(--color-surface-muted) / <alpha-value>)",
				"surface-brand": "rgb(var(--color-surface-brand) / <alpha-value>)",
				primary: {
					DEFAULT: "rgb(var(--color-primary) / <alpha-value>)",
					hover: "rgb(var(--color-primary-hover) / <alpha-value>)",
					foreground: "rgb(var(--color-primary-foreground) / <alpha-value>)",
				},
				accent: "rgb(var(--color-accent) / <alpha-value>)",
				"accent-muted": "rgb(var(--color-accent-muted) / <alpha-value>)",
				border: "rgb(var(--color-border) / <alpha-value>)",
				"border-strong": "rgb(var(--color-border-strong) / <alpha-value>)",
				"text-primary": "rgb(var(--color-text-primary) / <alpha-value>)",
				"text-secondary": "rgb(var(--color-text-secondary) / <alpha-value>)",
				"text-muted": "rgb(var(--color-text-muted) / <alpha-value>)",
				positive: "rgb(var(--color-positive) / <alpha-value>)",
				warning: "rgb(var(--color-warning) / <alpha-value>)",
				danger: "rgb(var(--color-danger) / <alpha-value>)",
				info: "rgb(var(--color-info) / <alpha-value>)",
			},
			fontFamily: {
				sans: ["var(--font-interface)", "sans-serif"],
				heading: ["var(--font-heading)", "sans-serif"],
			},
			borderRadius: {
				control: "10px",
				card: "16px",
				prominent: "20px",
			},
			boxShadow: {
				surface: "0 1px 2px rgb(16 42 46 / 0.05), 0 1px 3px rgb(16 42 46 / 0.04)",
				elevated: "0 12px 28px rgb(16 42 46 / 0.12)",
			},
			backgroundImage: {
				"gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
				"gradient-conic":
					"conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
			},
		},
	},
	darkMode: "class",
	plugins: [
		nextui({
			themes: {
				light: {
					colors: {
						background: "#F7F9F8",
						foreground: "#102A2E",
						primary: {
							foreground: "#FFFFFF",
							DEFAULT: "#0F6B63",
						},
						secondary: {
							foreground: "#102A2E",
							DEFAULT: "#E5F6F2",
						},
						focus: "#4377C5",
						content1: "#FFFFFF",
						content2: "#EFF4F2",
						success: "#278A65",
						warning: "#D59B3D",
						danger: "#D65F5F",
					},
				},
			},
		}),
	],
}
export default config
