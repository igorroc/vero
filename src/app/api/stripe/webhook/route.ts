import { NextResponse } from "next/server"

import { processStripeWebhookEvent } from "@/features/billing/stripe-subscriptions"
import { env } from "@/lib/env"
import { getStripe } from "@/lib/stripe"

export async function POST(request: Request) {
	const signature = request.headers.get("stripe-signature")
	const webhookSecret = env.STRIPE_WEBHOOK_SECRET
	if (!signature || !webhookSecret) {
		return NextResponse.json(
			{ error: "Invalid webhook configuration" },
			{ status: 400 },
		)
	}

	let event
	try {
		event = getStripe().webhooks.constructEvent(
			await request.text(),
			signature,
			webhookSecret,
		)
	} catch (error) {
		return NextResponse.json(
			{ error: "Invalid webhook signature" },
			{ status: 400 },
		)
	}

	try {
		await processStripeWebhookEvent(event)
		return NextResponse.json({ received: true })
	} catch (error) {
		console.error("Failed to process Stripe webhook", error)
		return NextResponse.json(
			{ error: "Webhook processing failed" },
			{ status: 500 },
		)
	}
}
