export interface CommitMerge {
	id: string;
	source: string;
}

export interface CommitRevert {
	hash: string;
	subject: string;
}

export interface CommitReference {
	prefix: string;
	issue: string;
	action: string | null;
	owner: string | null;
	repository: string | null;
}

export interface CommitNote {
	title: string;
	text: string;
}

export interface Commit {
	raw: string;

	subject: string;
	body: string;
	hash: string;
	/**
	 * Committer date in ISO 8601 format
	 * @example
	 * "2024-12-22T17:36:50Z"
	 */
	date: string;
	/**
	 * Committer name (respects .mailmap)
	 */
	name: string;
	/**
	 * Committer email (respects .mailmap)
	 */
	email: string;

	type: string;
	scope: string;
	breakingChange: string;
	title: string;

	merge: CommitMerge | null;
	revert: CommitRevert | null;
	mentions: string[];
	references: CommitReference[];
	notes: CommitNote[];
}
