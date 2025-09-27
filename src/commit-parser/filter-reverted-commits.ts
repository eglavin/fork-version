import type { Commit } from "./types";

/**
 * Filter out revert commits and their corresponding reverted commits,
 * this function expects the input to be sorted by date in descending order
 * from the most recent to the oldest commit.
 *
 * @example
 * ```ts
 * const commits: Commit[] = [...];
 * const filteredCommits = filterRevertedCommits(commits);
 * ```
 */
export function filterRevertedCommits(parsedCommits: Commit[]): Commit[] {
	const revertedCommits: Commit[] = [];

	for (const commit of parsedCommits) {
		if (!commit.revert) continue;

		// If this "revert commit" has been reverted, skip it
		if (
			revertedCommits.some(
				(r) => r.revert?.hash === commit.hash || r.revert?.subject === commit.subject,
			)
		) {
			continue;
		}

		revertedCommits.push(commit);
	}

	// If there are no reverts, return the original data
	if (revertedCommits.length === 0) {
		return parsedCommits;
	}

	const commitsWithoutReverts: Commit[] = [];

	for (const commit of parsedCommits) {
		if (commit.revert) continue;

		const revertedIndex = revertedCommits.findIndex(
			(r) => r.revert?.hash === commit.hash || r.revert?.subject === commit.subject,
		);
		if (revertedIndex !== -1) {
			// Remove the reverted commit from the list to prevent multiple removals.
			revertedCommits.splice(revertedIndex, 1);
			continue;
		}

		commitsWithoutReverts.push(commit);
	}

	return commitsWithoutReverts;
}
