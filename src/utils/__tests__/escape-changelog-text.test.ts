import { escapeChangelogText } from "../escape-changelog-text";

describe("escape-changelog-text", () => {
	it("should escape html tags, comments and declarations", () => {
		expect(escapeChangelogText("add <script>alert(1)</script>")).toBe(
			"add &lt;script>alert(1)&lt;/script>",
		);
		expect(escapeChangelogText("<!-- hidden -->")).toBe("&lt;!-- hidden -->");
		expect(escapeChangelogText('<a name="9.9.9"></a>')).toBe('&lt;a name="9.9.9">&lt;/a>');
	});

	it("should leave comparison operators and other markdown untouched", () => {
		const input = "**support** a < b, a <= b and [docs](https://example.com) #123";

		expect(escapeChangelogText(input)).toBe(input);
	});

	it("should not escape inside inline code spans or fenced code blocks", () => {
		expect(escapeChangelogText("support `Array<string>` and ``<T>``")).toBe(
			"support `Array<string>` and ``<T>``",
		);
		expect(escapeChangelogText("```html\n<div>\n# not a heading\n```")).toBe(
			"```html\n<div>\n# not a heading\n```",
		);
	});

	it("should escape lines that would render as headings", () => {
		expect(escapeChangelogText("first line\n## [9.9.9]")).toBe("first line\n\\## [9.9.9]");
		expect(escapeChangelogText("#")).toBe("\\#");
		expect(escapeChangelogText("  ### indented")).toBe("  \\### indented");
	});

	it("should not escape issue references or non heading hashes", () => {
		const input = "#123 fixed\n####### seven hashes\n    # indented code\nC# support";

		expect(escapeChangelogText(input)).toBe(input);
	});
});
