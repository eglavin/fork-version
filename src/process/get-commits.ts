import { CommitParser } from "../commit-parser/commit-parser";
import { filterRevertedCommits } from "../commit-parser/filter-reverted-commits";
import type { ForkConfig } from "../config/types";
import type { Logger } from "../services/logger";
import type { Git } from "../services/git";
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
	logger.debug(`Found ${foundCommits.length} commits since last tag (${latestTag ?? "none"})`);

	const commits = foundCommits.reduce((acc, commit) => {
		const parsed = commitParser.parse(commit);
		if (parsed) {
			acc.push(parsed);
		}
		return acc;
	}, [] as Commit[]);
	logger.debug(`Parsed ${commits.length} commits after applying commit parser`);

	const filteredCommits = filterRevertedCommits(commits);
	logger.debug(`Filtered to ${filteredCommits.length} commits after removing reverts`);

	return {
		latestTag,
		commits: filteredCommits,
	};
}
