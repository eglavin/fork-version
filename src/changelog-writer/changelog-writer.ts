import { createParserOptions } from "../commit-parser/options";
import { renderChangelogEntry } from "./templates";
import type { ParserOptions } from "../commit-parser/options";
import type { Commit, CommitReference } from "../commit-parser/types";
import type {
	CommitGroup,
	NoteGroup,
	RenderableCommit,
	RenderableCommitReference,
	RenderableNote,
	TransformedCommits,
	WriterContext,
} from "./types";
import type { CommitType } from "../config/types";
import type { WriterOptions } from "./options";

export class ChangelogWriter {
	#options: WriterOptions;
	#types: CommitType[];
	#issuePrefixes: string[];

	constructor(
		options: WriterOptions,
		types: CommitType[],
		commitParserOptions?: Partial<ParserOptions>,
	) {
		this.#types = types;
		this.#options = options;
		this.#issuePrefixes = createParserOptions(commitParserOptions).issuePrefixes ?? ["#"];

		this.expandUrl = this.expandUrl.bind(this);
		this.hasUnresolvedPlaceholder = this.hasUnresolvedPlaceholder.bind(this);
		this.findCommitType = this.findCommitType.bind(this);
		this.resolveSubjectUrls = this.resolveSubjectUrls.bind(this);
		this.resolveCommitUrl = this.resolveCommitUrl.bind(this);
		this.resolveReference = this.resolveReference.bind(this);
		this.transformCommits = this.transformCommits.bind(this);
		this.groupCommits = this.groupCommits.bind(this);
		this.groupNotes = this.groupNotes.bind(this);
		this.generate = this.generate.bind(this);
	}

	/**
	 * Replace every `{{key}}` placeholder found in `format` with the matching value from `values`.
	 *
	 * @example
	 * ```ts
	 * const format = "https://github.com/eglavin/fork-version/commit/{{hash}}";
	 * const values = { hash: "82f6cb0c" };
	 * writer.expandUrl(format, values); // "https://github.com/eglavin/fork-version/commit/82f6cb0c"
	 * ```
	 */
	expandUrl(format: string, values: Record<string, string | undefined>): string {
		return Object.entries(values).reduce((result, [key, value]) => {
			if (value === undefined) {
				return result;
			}

			return result.replaceAll(`{{${key}}}`, value);
		}, format);
	}

	/**
	 * Returns true if `url` still contains an unresolved `{{key}}` placeholder.
	 * This avoids rendering an invalid url being rendered to the output.
	 *
	 * @example
	 * ```ts
	 * hasUnresolvedPlaceholder("https://github.com/eglavin/fork-version/commit/82f6cb0c") // true
	 * hasUnresolvedPlaceholder("https://github.com/eglavin/fork-version/commit/{{hash}}") // false
	 * ```
	 */
	hasUnresolvedPlaceholder(url: string): boolean {
		return /\{\{\w+\}\}/.test(url);
	}

	/**
	 * Finds the configured type entry matching the given commit.
	 *
	 * Reverts are matched against a `revert` type entry rather than their own (usually empty) `type`.
	 */
	findCommitType(commit: Commit): CommitType | undefined {
		const typeKey = (commit.revert ? "revert" : commit.type || "").toLowerCase();

		return this.#types.find((entry) => {
			if (entry.type !== typeKey) return false;
			if (entry.scope && entry.scope !== commit.scope) return false;
			return true;
		});
	}

	/**
	 * Replaces inline issue references (e.g. `#123`) and `@mentions` found in a commit subject with
	 * markdown links, recording every issue reference it replaces in `seenIssues` so they can be
	 * excluded from the commit's footer references.
	 */
	resolveSubjectUrls(subject: string, seenIssues: Set<string>): string {
		let result = subject;

		if (this.#issuePrefixes.length > 0) {
			const issuePattern = new RegExp(`(${this.#issuePrefixes.join("|")})([a-z0-9]+)`, "g");

			result = result.replace(issuePattern, (_match, prefix: string, issue: string) => {
				// Still recorded even when left unlinked below, so it's excluded from the footer references.
				seenIssues.add(prefix + issue);

				const url = this.expandUrl(this.#options.issueUrlFormat, {
					id: issue,
					prefix,
				});
				return this.hasUnresolvedPlaceholder(url)
					? `${prefix}${issue}`
					: `[${prefix}${issue}](${url})`;
			});
		}

		result = result.replace(/\B@([a-z0-9](?:-?[a-z0-9/]){0,38})/g, (match, user: string) => {
			// Skip team/org mentions, e.g. `@org/team`.
			if (user.includes("/")) return match;

			const url = this.expandUrl(this.#options.userUrlFormat, { user });
			return this.hasUnresolvedPlaceholder(url) ? match : `[@${user}](${url})`;
		});

		return result;
	}

	/**
	 * Resolves a commit's full hash into a commit url, or `undefined` when it can't be linked.
	 */
	resolveCommitUrl(hash: string): string | undefined {
		if (!hash) return undefined;

		const commitUrl = this.expandUrl(this.#options.commitUrlFormat, { hash });
		return this.hasUnresolvedPlaceholder(commitUrl) ? undefined : commitUrl;
	}

	/**
	 * Resolves a commit reference into its display label and, when linkable, its issue url.
	 */
	resolveReference(reference: CommitReference): RenderableCommitReference {
		// The label only shows an owner/repository when the reference explicitly captured a
		// cross-repository issue, e.g. `owner/repo#123`.
		const label = `${reference.owner ? `${reference.owner}/` : ""}${reference.repository ?? ""}${reference.prefix}${reference.issue}`;
		const issueUrl = this.expandUrl(this.#options.issueUrlFormat, {
			owner: reference.owner ?? undefined,
			repository: reference.repository ?? undefined,
			id: reference.issue,
			prefix: reference.prefix,
		});

		return {
			label,
			url: this.hasUnresolvedPlaceholder(issueUrl) ? undefined : issueUrl,
		};
	}

	/**
	 * Filters and enriches the raw parsed commits ready for rendering:
	 * - Discards commits whose type isn't configured to show in the changelog, unless they contain a breaking change note.
	 * - Converts a `type!: subject` breaking change marker into a `BREAKING CHANGES` note when no explicit `BREAKING CHANGE:` footer was found.
	 * - Links inline issue references and `@mentions` found in the commit subject.
	 */
	transformCommits(commits: Commit[]): TransformedCommits {
		const transformed: TransformedCommits = {
			commits: [],
			notes: [],
		};

		for (const commit of commits) {
			const entry = this.findCommitType(commit);

			const commitNotes =
				commit.notes.length === 0 && commit.breakingChange
					? [{ title: "BREAKING CHANGES", text: commit.title || commit.subject }]
					: commit.notes;

			if (commitNotes.length === 0 && (!entry || entry.hidden)) {
				continue;
			}

			const scope = commit.scope === "*" ? "" : commit.scope;
			const seenIssues = new Set<string>();

			transformed.commits.push({
				// A commit kept only because of a breaking change but with no real configured section
				// (its type is hidden, or isn't configured at all) is grouped into a catch-all "Other
				// Changes" section instead of being listed with no heading.
				groupTitle: entry?.section || "Other Changes",
				scope,
				displaySubject: this.resolveSubjectUrls(commit.title || commit.subject, seenIssues),
				shortHash: commit.hash ? commit.hash.substring(0, 7) : "",
				commitUrl: this.resolveCommitUrl(commit.hash),
				references: commit.references
					.filter((reference) => !seenIssues.has(reference.prefix + reference.issue))
					.map(this.resolveReference),
			});

			for (const note of commitNotes) {
				transformed.notes.push({
					title: "BREAKING CHANGES",
					scope,
					text: note.text,
				});
			}
		}

		return transformed;
	}

	/**
	 * Groups commits by their section title, sorted using the order sections first appear in `types`.
	 *
	 * Commits within a group are sorted by scope, then subject.
	 */
	groupCommits(commits: RenderableCommit[]): CommitGroup[] {
		const sectionOrder = new Map<string, number>();
		for (let index = 0; index < this.#types.length; index++) {
			const type = this.#types[index];
			if (type.section) {
				sectionOrder.set(type.section, index);
			}
		}

		const groups = new Map<string | false, CommitGroup>();
		for (const commit of commits) {
			let group = groups.get(commit.groupTitle);
			if (!group) {
				group = {
					title: commit.groupTitle,
					commits: [],
				};
				groups.set(commit.groupTitle, group);
			}
			group.commits.push(commit);
		}

		const sortedGroups = Array.from(groups.values());
		for (const group of sortedGroups) {
			group.commits.sort((a, b) =>
				(a.scope + a.displaySubject).localeCompare(b.scope + b.displaySubject),
			);
		}

		// "Other Changes" always sorts after every configured section — it's a catch-all, not something
		// the user explicitly ordered.
		function rank(title: string | false) {
			return title === "Other Changes"
				? Number.POSITIVE_INFINITY
				: (sectionOrder.get(title || "") ?? -1);
		}

		return sortedGroups.sort((a, b) => rank(a.title) - rank(b.title));
	}

	/**
	 * Groups notes by title (in practice, always a single `BREAKING CHANGES` group).
	 */
	groupNotes(notes: RenderableNote[]): NoteGroup[] {
		const groups = new Map<string, NoteGroup>();
		for (const note of notes) {
			let group = groups.get(note.title);
			if (!group) {
				group = {
					title: note.title,
					notes: [],
				};
				groups.set(note.title, group);
			}
			group.notes.push(note);
		}

		return Array.from(groups.values()).sort((a, b) => a.title.localeCompare(b.title));
	}

	/**
	 * Generate a single markdown changelog entry for a release from a list of already parsed commits.
	 */
	generate(commits: Commit[], context: WriterContext): string {
		const date = context.date ?? new Date().toISOString().slice(0, 10);

		const compareUrl =
			context.previousTag && context.currentTag
				? this.expandUrl(this.#options.compareUrlFormat, {
						previousTag: context.previousTag,
						currentTag: context.currentTag,
					})
				: undefined;

		const transformedCommits = this.transformCommits(commits);

		return renderChangelogEntry({
			date,
			version: context.version,
			compareUrl: compareUrl && !this.hasUnresolvedPlaceholder(compareUrl) ? compareUrl : undefined,
			title: context.title,
			commitGroups: this.groupCommits(transformedCommits.commits),
			noteGroups: this.groupNotes(transformedCommits.notes),
		});
	}
}
