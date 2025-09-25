import { CommitParser } from "../commit-parser/commit-parser";
import { filterRevertedCommits } from "../commit-parser/filter-reverted-commits";
import type { ForkConfig } from "../config/types";
import type { Logger } from "../utils/logger";
import type { Git } from "../utils/git";
import type { Commit } from "../commit-parser/types";

export interface CommitsSinceTag {
	latestTag: string | undefined;
	commits: Commit[];
}

export async function getCommitsSinceTag(
	config: ForkConfig,
	logger: Logger,
	git: Git,
): Promise<CommitsSinceTag> {
	const commitParser = new CommitParser();
	if (config.debug) commitParser.setLogger(logger);

	const latestTag = await git.getMostRecentTag(config.tagPrefix);
	if (!latestTag) {
		logger.warn("No previous tag found, using all commits");
	}

	const foundCommits = await git.getCommits(latestTag, "HEAD");

	const commits = filterRevertedCommits(
		foundCommits.reduce((acc, commit) => {
			const parsed = commitParser.parse(commit);
			if (parsed) {
				acc.push(parsed);
			}
			return acc;
		}, [] as Commit[]),
	);

	return {
		latestTag,
		commits,
	};
}
