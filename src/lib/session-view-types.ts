export enum SessionView {
	PERSONAL = "personal",
	ADMIN = "admin",
	PROFESSIONAL = "professional",
}

export const SESSION_VIEW_COOKIE = "vero-session-view"

export function isSessionView(value: string): value is SessionView {
	return Object.values(SessionView).includes(value as SessionView)
}
