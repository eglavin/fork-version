import { parseRegExpString } from "../parse-regexp-string";

describe("parse-regexp-string", () => {
	it("should parse valid regex literals", () => {
		const regex1 = parseRegExpString("/abc/i");

		expect(regex1).toBeInstanceOf(RegExp);
		expect(regex1?.source).toBe("abc");
		expect(regex1?.flags).toBe("i");

		const match = regex1?.exec("ABC");
		expect(match).not.toBeNull();
		expect(match?.[0]).toBe("ABC");

		const noMatch = regex1?.exec("def");
		expect(noMatch).toBeNull();
	});

	it("should parse plain string patterns", () => {
		const regex2 = parseRegExpString("abc");

		expect(regex2).toBeInstanceOf(RegExp);
		expect(regex2?.source).toBe("abc");
		expect(regex2?.flags).toBe("");

		const match = regex2?.exec("abc");
		expect(match).not.toBeNull();
		expect(match?.[0]).toBe("abc");

		const noMatch = regex2?.exec("def");
		expect(noMatch).toBeNull();
	});

	it("should parse complex regex", () => {
		const subjectRegex = parseRegExpString(
			"/^(?<type>\\w+)(?:\\((?<scope>.*)\\))?(?<breakingChange>!)?:\\s+(?<title>.*)/",
		);

		expect(subjectRegex).toBeInstanceOf(RegExp);
		expect(subjectRegex?.source).toBe(
			"^(?<type>\\w+)(?:\\((?<scope>.*)\\))?(?<breakingChange>!)?:\\s+(?<title>.*)",
		);
		expect(subjectRegex?.flags).toBe("");

		const match = subjectRegex?.exec("feat(parser)!: add new feature");
		expect(match).not.toBeNull();
		expect(match?.groups?.type).toBe("feat");
		expect(match?.groups?.scope).toBe("parser");
		expect(match?.groups?.breakingChange).toBe("!");
		expect(match?.groups?.title).toBe("add new feature");
	});

	it("should return null for invalid regex patterns", () => {
		const invalidPattern = parseRegExpString("[unclosed");

		expect(invalidPattern).toBeNull();
	});
});
