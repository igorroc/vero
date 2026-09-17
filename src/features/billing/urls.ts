export function getApplicationUrl(origin: string | null): string {
	return process.env.NEXT_PUBLIC_APP_URL ?? origin ?? "http://localhost:3000"
}
