import { getCommitsSinceTag } from "../process/get-commits";
import { getCurrentVersion } from "../process/get-current-version";

import type { ForkConfig } from "../config/types";
import type { Logger } from "../services/logger";
import type { FileManager } from "../files/file-manager";
import type { Git } from "../services/git";

export async function inspectVersion(
	config: ForkConfig,
	logger: Logger,
	fileManager: FileManager,
	git: Git,
) {
	let foundVersion = "";

	try {
		const commits = await getCommitsSinceTag(config, logger, git);
		const currentVersion = await getCurrentVersion(
			config,
			logger,
			git,
			fileManager,
			config.files,
			commits.latestTagVersion,
		);
		if (currentVersion) foundVersion = currentVersion.version;
	} catch {
		// No version found
	}

	console.log(foundVersion);
}
