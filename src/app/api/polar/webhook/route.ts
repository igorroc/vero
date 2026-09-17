import { NextResponse } from "next/server"
import { webhooks } from "@polar-sh/sdk/2026-04"

import { processPolarWebhookEvent } from "@/features/billing/polar-subscriptions"
import { env } from "@/lib/env"

export async function POST(request: Request) {
	const webhookSecret = env.POLAR_WEBHOOK_SECRET
	const providerEventId = request.headers.get("webhook-id")
	if (!webhookSecret || !providerEventId) {
		return NextResponse.json(
			{ error: "Invalid webhook configuration" },
			{ status: 400 },
		)
	}

	let event
	try {
		event = await webhooks.validateEvent(
			await request.text(),
			Object.fromEntries(request.headers),
			webhookSecret,
		)
	} catch(err) {
		return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 })
	}

	try {
		await processPolarWebhookEvent(event, providerEventId)
		return NextResponse.json({ received: true })
	} catch (error) {
		console.error("Failed to process Polar webhook", error)
		return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
	}
}
