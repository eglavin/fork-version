/**
 * Matches, in order of precedence:
 * 1. An inline code span or fenced code block, e.g. `` `Array<string>` ``, left untouched as
 *    markdown renders their content literally.
 * 2. A `<` opening a html tag, comment or declaration, e.g. `<a name="9.9.9">` or `<!--`.
 * 3. The indentation before a `#` run that would render as a heading, e.g. `## [9.9.9]` but not
 *    `#123`.
 */
const CHANGELOG_TEXT_PATTERN = /(`+)[\s\S]*?\1|<(?=[a-z/!?])|^[ \t]{0,3}(?=#{1,6}(?:[ \t]|$))/gim;

/**
 * Escapes commit provided text (subjects, scopes and notes) before it's written to the changelog,
 * so a commit can't inject raw html or fake headings, e.g. a `## [9.9.9]` release heading.
 *
 * Other markdown such as `**bold**`, `` `code` `` and links is kept as-is.
 *
 * @example
 * ```ts
 * escapeChangelogText("add <script> support"); // "add &lt;script> support"
 * escapeChangelogText("support `Array<string>`"); // "support `Array<string>`"
 * escapeChangelogText("first line\n## [9.9.9]"); // "first line\n\\## [9.9.9]"
 * ```
 */
export function escapeChangelogText(input: string): string {
	return input.replaceAll(CHANGELOG_TEXT_PATTERN, (match: string, codeFence?: string) => {
		if (codeFence) return match;
		if (match === "<") return "&lt;";

		// Escape the heading marker, keeping any leading indentation.
		return `${match}\\`;
	});
}
