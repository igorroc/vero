import { z } from "zod"

import { BillingProvider } from "./billing-provider"

const envSchema = z.object({
	NODE_ENV: z
		.enum(["development", "test", "production"])
		.default("development"),
	DATABASE_DB: z.string().min(1).optional(),
	DATABASE_USER: z.string().min(1).optional(),
	DATABASE_PASSWORD: z.string().min(1).optional(),
	POSTGRES_PRISMA_URL: z.url(),
	AUTHENTICATION_SECRET_KEY: z.string().min(1),
	STRIPE_PUBLIC_KEY: z.string().min(1).optional(),
	STRIPE_SECRET_KEY: z.string().min(1).optional(),
	STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
	BILLING_PROVIDER: z.enum(BillingProvider).default(BillingProvider.STRIPE),
	NEXT_PUBLIC_APP_URL: z.url().optional(),
})

export const env = envSchema.parse(process.env)
