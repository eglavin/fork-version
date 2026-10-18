import semver, { type ReleaseType } from "semver";

import type { Commit } from "../commit-parser/types";
import type { ForkConfig } from "../config/types";
import type { Logger } from "../services/logger";
import { getReleaseType } from "../utils/release-type";

export interface NextVersion {
	version: string;
	releaseType?: ReleaseType;
	preMajor?: boolean;
	changes?: {
		major: number;
		minor: number;
		patch: number;
		merges: number;
		reverts: number;
	};
}

export function getNextVersion(
	config: ForkConfig,
	logger: Logger,
	commits: Commit[],
	currentVersion: string,
): NextVersion {
	if (config.skipBump) {
		logger.skipping(`Skipping bump, using ${currentVersion} as the next version`);
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
	const changes = {
		major: 0,
		minor: 0,
		patch: 0,
		merges: 0,
		reverts: 0,
	} satisfies NextVersion["changes"];

	if (config.releaseAs) {
		releaseType = config.releaseAs;
	} else {
		/**
		 * - 0 = major
		 * - 1 = minor
		 * - 2 = patch
		 */
		let level = 2;
		const MINOR_TYPES = new Set(["feat", "feature"]);

		for (const commit of commits) {
			// We shouldn't consider merge commits or reverts as changes.
			if (commit.merge) {
				changes.merges += 1;
				continue;
			}
			if (commit.revert) {
				changes.reverts += 1;
				continue;
			}

			if (commit.notes.length > 0 || commit.breakingChange) {
				changes.major += commit.notes.length + (commit.breakingChange ? 1 : 0);
				level = 0;
			} else if (MINOR_TYPES.has(commit.type.toLowerCase())) {
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
	const preReleaseIdentifier = typeof config.preRelease === "string" ? config.preRelease : "";
	const nextVersion = semver.inc(currentVersion, releaseTypeOrPreRelease, preReleaseIdentifier);

	// `semver.inc` returns null rather than throwing, e.g. for an invalid pre-release identifier
	// like "beta_1". Fail here instead of writing an empty version to files, commits and tags.
	if (!nextVersion) {
		throw new Error(
			`Unable to determine next version from ${currentVersion} (${releaseTypeOrPreRelease}${preReleaseIdentifier ? `, pre-release: "${preReleaseIdentifier}"` : ""})`,
		);
	}

	logger.log(`Next version: ${nextVersion} (${releaseTypeOrPreRelease})`);

	if (commits.length > 0) {
		logger.log(
			[
				`  - Commits: ${commits.length}`,
				changes.major > 0 ? `Majors: ${changes.major}` : undefined,
				changes.minor > 0 ? `Minors: ${changes.minor}` : undefined,
				changes.patch > 0 ? `Patches: ${changes.patch}` : undefined,
				changes.reverts > 0 ? `Reverts: ${changes.reverts}` : undefined,
				changes.merges > 0 ? `Merges: ${changes.merges}` : undefined,
			]
				.filter(Boolean)
				.join(", "),
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
