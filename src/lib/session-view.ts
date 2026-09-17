import { cookies } from "next/headers"

import { SESSION_VIEW_COOKIE, SessionView } from "./session-view-types"

export async function getSessionView(isSuperAdmin: boolean): Promise<SessionView> {
	const selectedView = (await cookies()).get(SESSION_VIEW_COOKIE)?.value
	if (selectedView === SessionView.ADMIN && isSuperAdmin) return selectedView

	// Professional view is reserved until professional accounts are implemented.
	return SessionView.PERSONAL
}
