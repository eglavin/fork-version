import { CommitParser } from "../commit-parser/commit-parser";
import { filterRevertedCommits } from "../commit-parser/filter-reverted-commits";
import { cleanTag } from "../utils/clean-tag";
import type { ForkConfig } from "../config/types";
import type { Logger } from "../services/logger";
import type { Git } from "../services/git";
import type { Commit } from "../commit-parser/types";

export interface CommitsSinceTag {
	tags: string[];
	latestTag: string | undefined;
	latestTagVersion: string | undefined;
	commits: Commit[];
}

export async function getCommitsSinceTag(
	config: ForkConfig,
	logger: Logger,
	git: Git,
): Promise<CommitsSinceTag> {
	const commitParser = new CommitParser(config.commitParserOptions);
	if (config.debug) commitParser.setLogger(logger);

	const tags = await git.getTags(config.tagPrefix, config.preRelease);
	const latestTag = tags.length > 0 ? tags[0] : undefined;
	if (!latestTag) {
		logger.warn("No previous tag found, using all commits");
	}

	const foundCommits = await git.getCommits(latestTag, "HEAD");
	const commits = foundCommits.reduce((acc, commit) => {
		const parsed = commitParser.parse(commit);
		if (parsed) {
			acc.push(parsed);
		}
		return acc;
	}, [] as Commit[]);
	const filteredCommits = filterRevertedCommits(commits);

	logger.debug(
		`Found ${foundCommits.length} commits since tag: ${latestTag ?? "none"} (${commits.length} parsed, ${filteredCommits.length} after filtering reverts)`,
	);

	return {
		tags,
		latestTag,
		latestTagVersion: cleanTag(latestTag, config.tagPrefix),
		commits: filteredCommits,
	};
}
