import { describe, it, expect } from "vitest"
import {
	MOCK_CONVERSATIONS,
	MOCK_GROUP_ORDER,
	type MockConversationGroup,
} from "./assistant-mocks"

describe("MOCK_CONVERSATIONS", () => {
	it("tem ids únicos e conteúdo válido", () => {
		const ids = MOCK_CONVERSATIONS.map((c) => c.id)
		expect(new Set(ids).size).toBe(ids.length)
		for (const conversation of MOCK_CONVERSATIONS) {
			expect(conversation.title.trim()).not.toBe("")
			expect(conversation.preview.trim()).not.toBe("")
			expect(MOCK_GROUP_ORDER).toContain(conversation.group)
			expect(conversation.timeLabel.trim()).not.toBe("")
			expect(conversation.leadMessages.length).toBeGreaterThan(0)
			for (const message of conversation.leadMessages) {
				expect(["user", "assistant"]).toContain(message.role)
				expect(message.text.trim()).not.toBe("")
			}
		}
	})

	it("cobre todos os grupos em ordem", () => {
		const groups = new Set<MockConversationGroup>(
			MOCK_CONVERSATIONS.map((c) => c.group),
		)
		for (const group of MOCK_GROUP_ORDER) {
			expect(groups.has(group)).toBe(true)
		}
	})
})
