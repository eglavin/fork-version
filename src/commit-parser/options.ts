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

export function createParserOptions(userOptions?: Partial<ParserOptions>): ParserOptions {
	const referenceActions = trimStringArray(userOptions?.referenceActions) ?? [
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

	const issuePrefixes = trimStringArray(userOptions?.issuePrefixes) ?? ["#"];
	const joinedIssuePrefixes = issuePrefixes.join("|");

	const noteKeywords = trimStringArray(userOptions?.noteKeywords) ?? [
		"BREAKING CHANGE",
		"BREAKING-CHANGE",
	];
	const joinedNoteKeywords = noteKeywords.join("|");

	return {
		subjectPattern: /^(?<type>\w+)(?:\((?<scope>.*)\))?(?<breakingChange>!)?:\s+(?<title>.*)/,

		mergePattern: /^Merge pull request #(?<id>\d*) from (?<source>.*)/,

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

		// Override defaults with user options
		...userOptions,
	};
}
