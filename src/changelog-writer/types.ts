export interface RenderableCommitReference {
	/**
	 * Pre-formatted issue label, e.g. `#123` or `owner/repo#123` for cross-repository references.
	 */
	label: string;
	/**
	 * Resolved issue URL, or `undefined` when the issue url format has an unresolved placeholder.
	 */
	url: string | undefined;
}

export interface RenderableCommit {
	/**
	 * The section this commit belongs to, or `false` if it should be rendered without a heading.
	 */
	groupTitle: string | false;
	scope: string;
	displaySubject: string;
	shortHash: string;
	/**
	 * Resolved commit URL, or `undefined` when there's no hash, or the commit url format has an
	 * unresolved placeholder (no supported git host detected).
	 */
	commitUrl: string | undefined;
	references: RenderableCommitReference[];
}

export interface RenderableNote {
	title: string;
	scope: string;
	text: string;
}

export interface TransformedCommits {
	commits: RenderableCommit[];
	notes: RenderableNote[];
}

export interface NoteGroup {
	title: string;
	notes: RenderableNote[];
}

export interface CommitGroup {
	title: string | false;
	commits: RenderableCommit[];
}

export interface WriterContext {
	/**
	 * The version this changelog entry is being generated for.
	 */
	version: string;
	/**
	 * The most recent existing tag, used to build the compare link.
	 */
	previousTag?: string;
	/**
	 * The tag which will be created for `version`.
	 */
	currentTag: string;
	/**
	 * An optional title for the release, rendered next to the version, e.g. `1.2.3 "Codename"`.
	 */
	title?: string;
	/**
	 * The release date, formatted as `yyyy-mm-dd`.
	 * @default today's date in UTC.
	 */
	date?: string;
}
