import { env } from "@/lib/env"

export function getApplicationUrl(origin: string | null): string {
	return env.NEXT_PUBLIC_APP_URL ?? origin ?? "http://localhost:3000"
}
