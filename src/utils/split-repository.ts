/**
 * Splits an issue reference's captured `owner/repository` text (from an `issuePattern` match, e.g.
 * `owner/repo#123`) into its separate `owner` and `repository` parts.
 *
 * @example
 * ```ts
 * splitRepository("owner/repo"); // { owner: "owner", repository: "repo" }
 * splitRepository("repo"); // { owner: null, repository: "repo" }
 * splitRepository(""); // { owner: null, repository: null }
 * ```
 */
export function splitRepository(repository: string): {
	owner: string | null;
	repository: string | null;
} {
	if (!repository) {
		return {
			owner: null,
			repository: null,
		};
	}

	const slashIndex = repository.indexOf("/");
	if (slashIndex === -1) {
		return {
			owner: null,
			repository,
		};
	}

	return {
		owner: repository.slice(0, slashIndex),
		repository: repository.slice(slashIndex + 1),
	};
}
