import semver, { type ReleaseType } from "semver";
import conventionalRecommendedBump from "conventional-recommended-bump";

import { getReleaseType } from "../utils/release-type";
import type { ForkConfig } from "../config/types";
import type { FileManager, FileState } from "../files/file-manager";
import type { Logger } from "../utils/logger";
import type { Git } from "../utils/git";

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
): Promise<CurrentVersion> {
	const files: FileState[] = [];
	const versions = new Set<string>();

	for (const file of filesToUpdate) {
		if (await git.isIgnored(file)) {
			logger.debug(`[Git Ignored] ${file}`);
			continue;
		}

		const fileState = fileManager.read(file);
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
	if (versions.size === 0 && config.gitTagFallback) {
		const version = await git.getHighestSemverVersionFromTags(config.tagPrefix);
		if (version) {
			logger.warn(`Using latest git tag as fallback`);
			versions.add(version);
		}
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

	// If we're just inspecting the version, output the version and exit
	if (config.inspectVersion) {
		console.log(currentVersion);
		process.exit(0);
	}

	logger.log(`Current version: ${currentVersion}`);
	return {
		files,
		version: currentVersion,
	};
}

export interface NextVersion {
	version: string;
	level?: number;
	preMajor?: boolean;
	reason?: string;
	releaseType?: ReleaseType;
}

export async function getNextVersion(
	config: ForkConfig,
	logger: Logger,
	currentVersion: string,
): Promise<NextVersion> {
	if (config.skipBump) {
		logger.warn(`Skip bump, using ${currentVersion} as the next version`);
		return {
			version: currentVersion,
		};
	}

	if (config.nextVersion && semver.valid(config.nextVersion)) {
		logger.log(`Next version: ${config.nextVersion}`);
		return {
			version: config.nextVersion,
		};
	}

	const isPreMajor = semver.lt(currentVersion, "1.0.0");

	let recommendedBump: Awaited<ReturnType<typeof conventionalRecommendedBump>>;
	if (config.releaseAs) {
		recommendedBump = {
			releaseType: config.releaseAs,
			level: -1,
			reason: "User defined",
		};
	} else {
		try {
			recommendedBump = await conventionalRecommendedBump({
				preset: {
					name: "conventionalcommits",
					...config.changelogPresetConfig,
					preMajor: isPreMajor,
				},
				path: config.path,
				tagPrefix: config.tagPrefix,
				cwd: config.path,
			});
		} catch (cause) {
			throw new Error(`[conventional-recommended-bump] Unable to determine next version`, {
				cause,
			});
		}
	}

	if (recommendedBump.releaseType) {
		const releaseType = getReleaseType(
			recommendedBump.releaseType,
			currentVersion,
			config.preRelease,
		);
		const nextVersion =
			semver.inc(
				currentVersion,
				releaseType,
				typeof config.preRelease === "string" ? config.preRelease : undefined,
			) ?? "";

		logger.log(`Next version: ${nextVersion} (${releaseType})`);
		return {
			...recommendedBump,
			preMajor: isPreMajor,
			releaseType,
			version: nextVersion,
		};
	}

	throw new Error("Unable to find next version");
}
