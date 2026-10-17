import type { ForkConfig } from "../config/types";
import { updateChangelog } from "../process/changelog";
import { commitChanges } from "../process/commit";
import { getCommitsSinceTag } from "../process/get-commits";
import { getCurrentVersion } from "../process/get-current-version";
import { getNextVersion } from "../process/get-next-version";
import { tagChanges } from "../process/tag";
import type { FileManager } from "../services/file-manager";
import type { Git } from "../services/git";
import type { Logger } from "../services/logger";

export async function main(config: ForkConfig, logger: Logger, fileManager: FileManager, git: Git) {
	logger.log(`Running fork-version - ${new Date().toUTCString()}`);
	logger.warn(config.dryRun ? "[Dry Run] No changes will be written to disk.\n" : "");

	const commits = await getCommitsSinceTag(config, logger, git);
	const current = await getCurrentVersion(
		config,
		logger,
		git,
		fileManager,
		config.files,
		commits.latestTagVersion,
	);
	const next = getNextVersion(config, logger, commits.commits, current.version);

	logger.log("Updating files: ");
	for (const outFile of current.files) {
		logger.log(`  - ${outFile.path}`);

		await fileManager.write(outFile, next.version);
	}

	await updateChangelog(config, logger, commits.commits, commits.latestTag, next.version);
	await commitChanges(config, logger, git, current.files, next.version);
	await tagChanges(config, logger, git, next.version);

	return {
		config,
		commits,
		current,
		next,
	};
}
