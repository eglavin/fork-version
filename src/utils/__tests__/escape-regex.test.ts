import { escapeRegex } from "../escape-regex";

describe("escape-regex", () => {
	it("should escape special regex characters in a string", () => {
		const input = "Hello. How are you?";

		expect(escapeRegex(input)).toBe("Hello\\. How are you\\?");
	});

	it("should escape all special characters", () => {
		const input = ".*+?^${}()|[]\\";

		expect(escapeRegex(input)).toBe("\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\");
	});

	it("should return the same string if there are no special characters", () => {
		const input = "Hello World";

		expect(escapeRegex(input)).toBe("Hello World");
	});
});
