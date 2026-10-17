import { styleText } from "node:util";

import type { ForkConfig } from "../config/types";
import { getCommitsSinceTag } from "../process/get-commits";
import { getCurrentVersion } from "../process/get-current-version";
import type { FileManager } from "../services/file-manager";
import type { Git } from "../services/git";
import type { Logger } from "../services/logger";

export async function inspect(
	config: ForkConfig,
	logger: Logger,
	fileManager: FileManager,
	git: Git,
) {
	let latestTag = "";
	let latestVersion = "";

	try {
		const commits = await getCommitsSinceTag(config, logger, git);
		if (commits.latestTag) {
			latestTag = commits.latestTag;
			latestVersion = commits.latestTagVersion ?? "";
		}

		const currentVersion = await getCurrentVersion(
			config,
			logger,
			git,
			fileManager,
			config.files,
			latestVersion,
		);
		if (currentVersion.version) {
			latestVersion = currentVersion.version;
		}
	} catch {
		// No version found
	}

	if (!latestVersion && !latestTag) {
		console.error(
			styleText(
				"yellowBright",
				"No version found. Make sure you have at least one tag in your repository.",
			),
		);
		process.exit(1);
		return;
	}

	switch (config.command) {
		case "inspect-version": {
			console.log(
				config.asJson
					? JSON.stringify(
							{
								version: latestVersion,
							},
							null,
							2,
						)
					: latestVersion,
			);
			break;
		}
		case "inspect-tag": {
			console.log(
				config.asJson
					? JSON.stringify(
							{
								tag: latestTag,
							},
							null,
							2,
						)
					: latestTag,
			);
			break;
		}
		default: {
			console.log(
				config.asJson
					? JSON.stringify(
							{
								version: latestVersion,
								tag: latestTag,
							},
							null,
							2,
						)
					: `
Version: ${latestVersion}
Tag: ${latestTag}
`.trim(),
			);
		}
	}
}
