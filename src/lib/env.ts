import { z } from "zod"

const envSchema = z.object({
	NODE_ENV: z
		.enum(["development", "test", "production"])
		.default("development"),
	DATABASE_DB: z.string().min(1).optional(),
	DATABASE_USER: z.string().min(1).optional(),
	DATABASE_PASSWORD: z.string().min(1).optional(),
	POSTGRES_PRISMA_URL: z.string().url(),
	AUTHENTICATION_SECRET_KEY: z.string().min(1),
	STRIPE_SECRET_KEY: z.string().min(1).optional(),
	STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
	BILLING_PROVIDER: z.literal("stripe").default("stripe"),
	NEXT_PUBLIC_APP_URL: z.url().optional(),
})

export const env = envSchema.parse(process.env)
