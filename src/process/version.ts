import semver, { type ReleaseType } from "semver";

import { getReleaseType } from "../utils/release-type";
import type { ForkConfig } from "../config/types";
import type { FileManager, FileState } from "../files/file-manager";
import type { Logger } from "../utils/logger";
import type { Git } from "../utils/git";
import type { Commit } from "../commit-parser/types";

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
	releaseType?: ReleaseType;
	preMajor?: boolean;
	changes?: { major: number; minor: number; patch: number };
}

export async function getNextVersion(
	config: ForkConfig,
	logger: Logger,
	commits: Commit[],
	currentVersion: string,
): Promise<NextVersion> {
	if (config.skipBump) {
		logger.warn(`Skip bump, using ${currentVersion} as the next version`);
		return {
			version: currentVersion,
		};
	}

	if (config.nextVersion) {
		if (!semver.valid(config.nextVersion)) {
			throw new Error(`Invalid Version: ${config.nextVersion}`);
		}

		logger.log(`Next version: ${config.nextVersion}`);
		return {
			version: config.nextVersion,
		};
	}

	const isPreMajor = semver.lt(currentVersion, "1.0.0");
	let releaseType: "major" | "minor" | "patch" = "patch";
	const changes = { major: 0, minor: 0, patch: 0 } satisfies NextVersion["changes"];

	if (config.releaseAs) {
		releaseType = config.releaseAs;
	} else {
		/**
		 * - 0 = major
		 * - 1 = minor
		 * - 2 = patch
		 */
		let level = 2;
		const MINOR_TYPES = ["feat", "feature"];

		for (const commit of commits) {
			if (commit.notes.length > 0 || commit.breakingChange) {
				changes.major += commit.notes.length + (commit.breakingChange ? 1 : 0);
				level = 0;
			} else if (MINOR_TYPES.includes(commit.type.toLowerCase())) {
				changes.minor += 1;
				if (level === 2) {
					level = 1;
				}
			} else {
				changes.patch += 1;
			}
		}

		// If we are pre 1.0.0, we want to downgrade major bumps to minor, and minor bumps to patch.
		// This is because 0.x.y versions are considered unstable, and breaking changes are expected.
		if (isPreMajor && level < 2) {
			level++;
			changes.patch += changes.minor;
			changes.minor = changes.major;
			changes.major = 0;
		}

		if (level === 0) {
			releaseType = "major";
		} else if (level === 1) {
			releaseType = "minor";
		} else {
			releaseType = "patch";
		}
	}

	const releaseTypeOrPreRelease = getReleaseType(releaseType, currentVersion, config.preRelease);
	const nextVersion =
		semver.inc(
			currentVersion,
			releaseTypeOrPreRelease,
			typeof config.preRelease === "string" ? config.preRelease : undefined,
		) ?? "";

	logger.log(`Next version: ${nextVersion} (${releaseTypeOrPreRelease})`);

	if (commits.length > 0) {
		logger.log(
			`  - Commits: ${commits.length}` +
				(changes.major > 0 ? `, Breaking Changes: ${changes.major}` : "") +
				(changes.minor > 0 ? `, New Features: ${changes.minor}` : "") +
				(changes.patch > 0 ? `, Bug Fixes: ${changes.patch}` : ""),
		);
	} else {
		logger.log("  - No commits found.");
	}

	return {
		version: nextVersion,
		releaseType: releaseTypeOrPreRelease,
		preMajor: isPreMajor,
		changes,
	};
}
