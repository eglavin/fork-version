import { createParserOptions, type ParserOptions } from "../options";

describe("commit-parser options", () => {
	describe("subjectPattern", () => {
		it("should create default options and match subject", () => {
			const options = createParserOptions();

			const subjectMatch = options.subjectPattern?.exec("feat: add new feature");
			expect(subjectMatch?.groups?.type).toBe("feat");
			expect(subjectMatch?.groups?.scope).toBeUndefined();
			expect(subjectMatch?.groups?.breakingChange).toBeUndefined();
			expect(subjectMatch?.groups?.title).toBe("add new feature");
		});

		it("should be able to modify subject pattern", () => {
			const options = createParserOptions({
				subjectPattern: /^(?<type>\w*):\s*(?<title>.*)$/,
			});

			const subjectMatch = options.subjectPattern?.exec("fix: correct typo");
			expect(subjectMatch?.groups?.type).toBe("fix");
			expect(subjectMatch?.groups?.title).toBe("correct typo");
		});

		it("should be able to modify subject pattern with a string", () => {
			const options = createParserOptions({
				subjectPattern: "^(?<type>\\w*):\\s*(?<title>.*)$" as unknown as RegExp,
			});

			const subjectMatch = options.subjectPattern?.exec("fix: correct typo");
			expect(subjectMatch?.groups?.type).toBe("fix");
			expect(subjectMatch?.groups?.title).toBe("correct typo");
		});

		it("should ignore invalid subject pattern string", () => {
			const options = createParserOptions({
				subjectPattern: "(?<type>\\w*):\\s*(?<title>.*" as unknown as RegExp, // Invalid regex string
			});

			expect(options.subjectPattern).toBeDefined();
		});
	});

	describe("referenceActions", () => {
		it("should create default options and match reference actions", () => {
			const options = createParserOptions();

			const referenceActionMatch = options.referenceActionPattern?.exec("closes #123");
			expect(referenceActionMatch?.groups?.action).toBe("closes");
			expect(referenceActionMatch?.groups?.reference).toBe("#123");
		});

		it("should be able to modify reference actions", () => {
			const options = createParserOptions({
				referenceActions: ["implements"],
			});

			const referenceActionMatch = options.referenceActionPattern?.exec("implements #456");
			expect(referenceActionMatch?.groups?.action).toBe("implements");
			expect(referenceActionMatch?.groups?.reference).toBe("#456");

			const noMatch = options.referenceActionPattern?.exec("closes #123");
			expect(noMatch).toBeNull();
		});
	});

	describe("general", () => {
		it("should ignore unknown options", () => {
			const options = createParserOptions({
				unknownOption: "test",
			} as unknown as Partial<ParserOptions>);

			expect(options).not.toHaveProperty("unknownOption");
		});

		it("should be abele to unset a pattern by providing a null or undefined value", () => {
			const options = createParserOptions({
				commentPattern: undefined,
				mentionPattern: null as never,
			});

			expect(options.commentPattern).toBeUndefined();
			expect(options.mentionPattern).toBeUndefined();
		});
	});
});
