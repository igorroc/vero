import { describe, it, expect } from "vitest"
import {
	groupConversations,
	groupForDate,
	timeLabelForDate,
} from "./conversation-groups"

const NOW = new Date(2026, 8, 23, 15, 30) // 23/09/2026 15:30 (local)

describe("groupForDate", () => {
	it("classifica hoje, ontem, semana e antigas", () => {
		expect(groupForDate(new Date(2026, 8, 23, 10, 0), NOW)).toBe("Hoje")
		expect(groupForDate(new Date(2026, 8, 22, 23, 0), NOW)).toBe("Ontem")
		expect(groupForDate(new Date(2026, 8, 18, 12, 0), NOW)).toBe("Esta semana")
		expect(groupForDate(new Date(2026, 8, 10, 12, 0), NOW)).toBe("Mais antigas")
	})
})

describe("timeLabelForDate", () => {
	it("usa hora hoje, 'Ontem' ontem e dd/MM antes", () => {
		expect(timeLabelForDate(new Date(2026, 8, 23, 10, 24), NOW)).toBe("10:24")
		expect(timeLabelForDate(new Date(2026, 8, 22, 9, 0), NOW)).toBe("Ontem")
		expect(timeLabelForDate(new Date(2026, 8, 18, 9, 0), NOW)).toBe("18/09")
	})
})

describe("groupConversations", () => {
	it("agrupa em ordem e omite grupos vazios", () => {
		const sections = groupConversations(
			[
				{ id: "a", updatedAt: new Date(2026, 8, 10) },
				{ id: "b", updatedAt: new Date(2026, 8, 23, 9, 0) },
			],
			NOW,
		)
		expect(sections.map((s) => s.group)).toEqual(["Hoje", "Mais antigas"])
		expect(sections[0]?.items.map((i) => i.id)).toEqual(["b"])
	})
})
