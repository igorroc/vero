import Stripe from "stripe"

import { env } from "./env"

let stripe: Stripe | undefined

export function getStripe(): Stripe {
	const secretKey = env.STRIPE_SECRET_KEY
	if (!secretKey) throw new Error("STRIPE_SECRET_KEY is not configured")

	stripe ??= new Stripe(secretKey)
	return stripe
}
