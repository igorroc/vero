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
	POLAR_ACCESS_TOKEN: z.string().min(1).optional(),
	POLAR_WEBHOOK_SECRET: z.string().min(1).optional(),
	POLAR_ENVIRONMENT: z.enum(["sandbox", "production"]).default("sandbox"),
	BILLING_PROVIDER: z.enum(BillingProvider).default(BillingProvider.POLAR),
	NEXT_PUBLIC_APP_URL: z.url().optional(),
	// IA (fase 02+): provedor trocável via AI SDK. Tudo opcional: sem chave,
	// recursos de IA desabilitam com mensagem e o resto do app funciona.
	AI_PROVIDER: z.enum(["openai", "google", "openrouter"]).default("openai"),
	AI_MODEL: z.string().min(1).optional(),
	OPENAI_API_KEY: z.string().min(1).optional(),
	GOOGLE_GENERATIVE_AI_API_KEY: z.string().min(1).optional(),
	OPENROUTER_API_KEY: z.string().min(1).optional(),
})

export const env = envSchema.parse(process.env)
