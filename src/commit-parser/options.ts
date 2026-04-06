import { escapeRegex } from "../utils/escape-regex";
import { parseRegExpString } from "../utils/parse-regexp-string";
import { trimStringArray } from "../utils/trim-string-array";

export interface ParserOptions {
	/**
	 * Pattern to match commit subjects
	 * - Expected capture groups: `type` `title`
	 * - Optional capture groups: `scope`, `breakingChange`
	 */
	subjectPattern: RegExp | undefined;

	/**
	 * Pattern to match merge commits
	 * - Expected capture groups: `id`, `source`
	 */
	mergePattern: RegExp | undefined;

	/**
	 * Pattern to match revert commits
	 * - Expected capture groups: `subject`, `hash`
	 */
	revertPattern: RegExp | undefined;

	/**
	 * Pattern to match commented out lines which will be trimmed
	 */
	commentPattern: RegExp | undefined;

	/**
	 * Pattern to match mentions
	 * - Expected capture groups: `username`
	 */
	mentionPattern: RegExp | undefined;

	/**
	 * List of action labels to match reference sections
	 * @default
	 * ["close", "closes", "closed", "fix", "fixes", "fixed", "resolve", "resolves", "resolved"]
	 */
	referenceActions?: string[];
	/**
	 * Pattern to match reference sections
	 * - Expected capture groups: `action`, `reference`
	 */
	referenceActionPattern: RegExp | undefined;

	/**
	 * List of issue prefixes to match issue ids
	 * @default
	 * ["#"]
	 */
	issuePrefixes?: string[];
	/**
	 * Pattern to match issue references
	 * - Expected capture groups: `repository`, `prefix`, `issue`
	 */
	issuePattern: RegExp | undefined;

	/**
	 * List of keywords to match note titles
	 * @default
	 * ["BREAKING CHANGE", "BREAKING-CHANGE"]
	 */
	noteKeywords?: string[];
	/**
	 * Pattern to match note sections
	 * - Expected capture groups: `title`
	 * - Optional capture groups: `text`
	 */
	notePattern: RegExp | undefined;
}

/**
 * Creates default parser options with predefined patterns and lists.
 *
 * The default expects the user is using Github as their hosting service.
 *
 * @param userOptions Optional user-provided options to override the defaults.
 * @returns A complete set of parser options with defaults applied and user overrides where specified.
 */
function createDefaultParserOptions(userOptions?: Partial<ParserOptions>): ParserOptions {
	const referenceActions = trimStringArray(userOptions?.referenceActions, escapeRegex) ?? [
		"close",
		"closes",
		"closed",
		"fix",
		"fixes",
		"fixed",
		"resolve",
		"resolves",
		"resolved",
	];
	const joinedReferenceActions = referenceActions.join("|");

	const issuePrefixes = trimStringArray(userOptions?.issuePrefixes, escapeRegex) ?? ["#"];
	const joinedIssuePrefixes = issuePrefixes.join("|");

	const noteKeywords = trimStringArray(userOptions?.noteKeywords, escapeRegex) ?? [
		"BREAKING CHANGE",
		"BREAKING-CHANGE",
	];
	const joinedNoteKeywords = noteKeywords.join("|");

	return {
		subjectPattern: /^(?<type>\w+)(?:\((?<scope>.*)\))?(?<breakingChange>!)?:\s+(?<title>.*)/i,

		mergePattern: /^Merge pull request #(?<id>\d*) from (?<source>.*)/i,

		revertPattern: /^[Rr]evert "(?<subject>.*)"(\s*This reverts commit (?<hash>[a-zA-Z0-9]*)\.)?/,

		commentPattern: /^#(?!\d+\s)/,

		mentionPattern: /(?<!\w)@(?<username>[\w-]+)/,

		referenceActions,
		referenceActionPattern: joinedReferenceActions
			? new RegExp(
					`(?<action>${joinedReferenceActions})(?:\\s+(?<reference>.*?))(?=(?:${joinedReferenceActions})|$)`,
				)
			: undefined,

		issuePrefixes,
		issuePattern: joinedIssuePrefixes
			? new RegExp(
					`(?:.*?)??\\s*(?<repository>[\\w-\\.\\/]*?)??(?<prefix>${joinedIssuePrefixes})(?<issue>[\\w-]*\\d+)`,
				)
			: undefined,

		noteKeywords,
		notePattern: joinedNoteKeywords
			? new RegExp(`^(?<title>${joinedNoteKeywords}):(\\s*(?<text>.*))`)
			: undefined,
	};
}

/**
 * Creates parser options by merging user-provided options with default values.
 *
 * Additionally, if a user provides a string for a property that expects a RegExp value,
 * the function will attempt to parse it into a RegExp object.
 *
 * @param userOptions Optional user-provided options to override the defaults.
 * @return A complete set of parser options with defaults applied and user overrides where specified.
 */
export function createParserOptions(userOptions?: Partial<ParserOptions>): ParserOptions {
	const initialOptions = createDefaultParserOptions(userOptions);

	if (userOptions) {
		for (const key of Object.keys(userOptions) as (keyof ParserOptions)[]) {
			const userValue = userOptions[key];

			// Skip properties that are not defined in the default options
			if (!(key in initialOptions)) {
				continue;
			}

			// Arrays should get merged in the default parser options function, so we skip them here
			if (Array.isArray(initialOptions[key])) {
				continue;
			}

			if (initialOptions[key] instanceof RegExp) {
				// User has provided a RegExp, so we can directly assign it
				if (userValue instanceof RegExp) {
					(initialOptions[key] as RegExp) = userValue;
				}
				// User has provided a string that may represent a RegExp pattern
				else if (typeof userValue === "string") {
					const parsed = parseRegExpString(userValue);
					if (parsed) {
						(initialOptions[key] as RegExp) = parsed;
					}
				}
				// Explicitly set nullable values to undefined
				else if (userValue == undefined) {
					initialOptions[key] = undefined;
				}
			}
		}
	}

	return initialOptions;
}
