import semver from "semver";

import type { ForkConfig } from "../config/types";
import type { FileManager, FileState } from "../files/file-manager";
import type { Logger } from "../services/logger";
import type { Git } from "../services/git";

export interface CurrentVersion {
	version: string;
	files: FileState[];
}

export async function getCurrentVersion(
	config: ForkConfig,
	logger: Logger,
	git: Git,
	fileManager: FileManager,
	filesToUpdate: string[],
	latestTagVersion: string | undefined,
): Promise<CurrentVersion> {
	const files: FileState[] = [];
	const versions = new Set<string>();

	for (const file of filesToUpdate) {
		if (await git.isIgnored(file)) {
			logger.debug(`[Git Ignored] ${file}`);
			continue;
		}

		const fileState = await fileManager.read(file);
		if (fileState) {
			files.push(fileState);

			if (!config.currentVersion) {
				versions.add(fileState.version);
			}
		}
	}

	if (config.currentVersion) {
		versions.add(config.currentVersion);
	}

	// If we still don't have a version, try to get the highest version from git tags
	if (versions.size === 0 && config.gitTagFallback && latestTagVersion) {
		logger.warn(`Using latest git tag as fallback`);
		versions.add(latestTagVersion);
	}

	if (versions.size === 0) {
		throw new Error("Unable to find current version");
	} else if (versions.size > 1) {
		if (!config.allowMultipleVersions) {
			throw new Error("Found multiple versions");
		}
		logger.warn(
			`Found multiple versions (${Array.from(versions).join(", ")}), using the higher semver version`,
		);
	}

	const currentVersion = semver.rsort(Array.from(versions))[0];

	logger.log(`Current version: ${currentVersion}`);
	return {
		files,
		version: currentVersion,
	};
}
