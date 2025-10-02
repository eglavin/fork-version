import { resolve } from "node:path";
import { writeFileSync, readFileSync } from "node:fs";
import conventionalChangelog from "conventional-changelog";

import { fileExists } from "../utils/file-state";
import type { ForkConfig } from "../config/types";
import type { Logger } from "../services/logger";

/**
 * Matches the following changelog header formats:
 * - `## [1.2.3]`
 * - `<a name="1.2.3"></a>`
 */
const RELEASE_PATTERN = /(^#+ \[?[0-9]+\.[0-9]+\.[0-9]+|<a name=)/m;

/**
 * Get the existing changelog content from the latest release onwards.
 * @see {@link RELEASE_PATTERN}
 */
function getOldReleaseContent(filePath: string, exists: boolean): string {
	if (exists) {
		const fileContents = readFileSync(filePath, "utf-8");
		const oldContentStart = fileContents.search(RELEASE_PATTERN);

		if (oldContentStart !== -1) {
			return fileContents.substring(oldContentStart);
		}
	}

	return "";
}

/**
 * Generate the new changelog content for this release.
 */
function getNewReleaseContent(
	config: ForkConfig,
	logger: Logger,
	nextVersion: string,
): Promise<string> {
	return new Promise<string>((onResolve) => {
		let newContent = "";

		conventionalChangelog(
			{
				preset: {
					name: "conventionalcommits",
					...config.changelogPresetConfig,
				},
				tagPrefix: config.tagPrefix,
				warn: (...message: string[]) => logger.debug("[conventional-changelog] ", ...message),
				cwd: config.path,
			},
			{
				version: nextVersion,
			},
			{
				merges: null,
				path: config.path,
			},
		)
			.on("error", (cause) => {
				throw new Error("[conventional-changelog] Unable to parse changes", { cause });
			})
			.on("data", (chunk) => {
				newContent += chunk.toString();
			})
			.on("end", () => {
				onResolve(newContent);
			});
	});
}

export async function updateChangelog(
	config: ForkConfig,
	logger: Logger,
	nextVersion: string,
): Promise<void> {
	if (config.skipChangelog) {
		logger.warn("Skip changelog update");
		return;
	}

	if (config.header.search(RELEASE_PATTERN) !== -1) {
		// Need to ensure the header doesn't contain the release pattern
		throw new Error("Header cannot contain release pattern");
	}

	// Create the changelog file if it doesn't exist
	const changelogPath = resolve(config.path, config.changelog);

	if (!config.dryRun && !fileExists(changelogPath)) {
		logger.log(`Creating changelog: ${changelogPath}`);
		writeFileSync(changelogPath, "\n", "utf8");
	} else {
		logger.log(`Updating changelog: ${changelogPath}`);
	}

	const oldContent = getOldReleaseContent(changelogPath, fileExists(changelogPath));
	const newContent = await getNewReleaseContent(config, logger, nextVersion);

	if (!config.dryRun && newContent) {
		writeFileSync(
			changelogPath,
			`${config.header}
${newContent}
${oldContent}
`.trim(),
			"utf8",
		);
	}
}
