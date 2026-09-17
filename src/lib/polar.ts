import { createPolar } from "@polar-sh/sdk/2026-04"

import { env } from "./env"

let polar: ReturnType<typeof createPolar> | undefined

export function getPolar(): ReturnType<typeof createPolar> {
	const accessToken = env.POLAR_ACCESS_TOKEN
	if (!accessToken) throw new Error("POLAR_ACCESS_TOKEN is not configured")

	polar ??= createPolar({ accessToken, environment: env.POLAR_ENVIRONMENT })
	return polar
}
