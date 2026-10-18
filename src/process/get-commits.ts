import { CommitParser } from "../commit-parser/commit-parser";
import { filterRevertedCommits } from "../commit-parser/filter-reverted-commits";
import type { Commit } from "../commit-parser/types";
import type { ForkConfig } from "../config/types";
import type { Git } from "../services/git";
import type { Logger } from "../services/logger";
import { cleanTag } from "../utils/clean-tag";

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
		if (await git.isShallowRepository()) {
			logger.warn(
				"No previous tag found in a shallow clone, the full commit history and tags may not be available.\n" +
					"If running in CI, fetch the full history (e.g. `fetch-depth: 0` with actions/checkout, or `git fetch --unshallow --tags`).",
			);
		} else {
			logger.warn("No previous tag found, using all commits");
		}
	}

	const foundCommits = await git.getCommits(latestTag, "HEAD", ...(config.commitPath ?? []));
	const commits = foundCommits.reduce<Commit[]>((acc, commit) => {
		const parsed = commitParser.parse(commit);
		if (parsed) {
			acc.push(parsed);
		}
		return acc;
	}, []);
	const filteredCommits = filterRevertedCommits(commits);

	logger.debug(
		`Found ${foundCommits.length} commits since tag: ${latestTag ?? "none"}${
			config.commitPath?.length ? ` in path: ${config.commitPath.join(", ")}` : ""
		} (${commits.length} parsed, ${filteredCommits.length} after filtering reverts)`,
	);

	return {
		tags,
		latestTag,
		latestTagVersion: cleanTag(latestTag, config.tagPrefix),
		commits: filteredCommits,
	};
}
