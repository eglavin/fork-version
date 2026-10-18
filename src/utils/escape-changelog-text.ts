/**
 * A `<` opening a html tag, comment or declaration, e.g. `<a name="9.9.9">` or `<!--`.
 */
const HTML_TAG_PATTERN = /<(?=[a-z/!?])/gi;

/**
 * The indentation before a `#` run that would render as a heading, e.g. `## [9.9.9]` but not
 * `#123`. Matches at the start of the text or after a newline.
 */
const HEADING_PATTERN = /(^|\n)([ \t]{0,3})(?=#{1,6}(?:[ \t\n]|$))/g;

/**
 * Find the ranges of inline code spans and fenced code blocks, which markdown renders literally.
 *
 * Follows the markdown rule that a code span opened by a run of backticks is closed by the next run
 * of exactly the same length. Runs a single pass over the input (no backtracking regex) so long
 * runs of backticks in commit text can't cause excessive processing time.
 *
 * @returns Half open `[start, end)` ranges, in order.
 */
function findCodeRanges(input: string): [number, number][] {
	const runs: { start: number; length: number }[] = [];
	for (let index = 0; index < input.length; index++) {
		if (input[index] !== "`") continue;

		const start = index;
		while (input[index + 1] === "`") index++;
		runs.push({ start, length: index - start + 1 });
	}

	// For each run length, the indexes (into `runs`) of every run with that length, in order.
	const runsByLength = new Map<number, number[]>();
	for (const [runIndex, run] of runs.entries()) {
		const sameLength = runsByLength.get(run.length) ?? [];
		sameLength.push(runIndex);
		runsByLength.set(run.length, sameLength);
	}

	// How far through each length's list has been consumed, so every run is only visited once.
	const cursors = new Map<number, number>();
	const ranges: [number, number][] = [];

	for (let runIndex = 0; runIndex < runs.length; runIndex++) {
		const opener = runs[runIndex];
		const sameLength = runsByLength.get(opener.length) ?? [];

		let cursor = cursors.get(opener.length) ?? 0;
		while (cursor < sameLength.length && sameLength[cursor] <= runIndex) cursor++;
		cursors.set(opener.length, cursor);

		// No closing run of this length, so it's literal backticks rather than a code span.
		if (cursor >= sameLength.length) continue;

		const closerIndex = sameLength[cursor];
		const closer = runs[closerIndex];
		ranges.push([opener.start, closer.start + closer.length]);
		runIndex = closerIndex;
	}

	return ranges;
}

/**
 * Escape a piece of text that is outside of any code span.
 *
 * @param atLineStart Whether `text` starts at the beginning of a line in the full input.
 */
function escapeOutsideCode(text: string, atLineStart: boolean): string {
	return text
		.replaceAll(HTML_TAG_PATTERN, "&lt;")
		.replaceAll(HEADING_PATTERN, (match: string, lineBreak: string, indent: string) =>
			lineBreak || atLineStart ? `${lineBreak}${indent}\\` : match,
		);
}

/**
 * Escapes commit provided text (subjects, scopes and notes) before it's written to the changelog,
 * so a commit can't inject raw html or fake headings, e.g. a `## [9.9.9]` release heading.
 *
 * Other markdown such as `**bold**`, `` `code` `` and links is kept as-is, and nothing inside
 * inline code spans or fenced code blocks is changed.
 *
 * @example
 * ```ts
 * escapeChangelogText("add <script> support"); // "add &lt;script> support"
 * escapeChangelogText("support `Array<string>`"); // "support `Array<string>`"
 * escapeChangelogText("first line\n## [9.9.9]"); // "first line\n\\## [9.9.9]"
 * ```
 */
export function escapeChangelogText(input: string): string {
	let result = "";
	let position = 0;

	for (const [start, end] of findCodeRanges(input)) {
		result += escapeOutsideCode(
			input.slice(position, start),
			position === 0 || input[position - 1] === "\n",
		);
		result += input.slice(start, end);
		position = end;
	}

	result += escapeOutsideCode(
		input.slice(position),
		position === 0 || input[position - 1] === "\n",
	);

	return result;
}
