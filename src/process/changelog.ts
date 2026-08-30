import { resolve } from "node:path";
import { writeFile, readFile } from "node:fs/promises";
import conventionalChangelog from "conventional-changelog";

import { ChangelogWriter } from "../changelog-writer/changelog-writer";
import { fileExists } from "../utils/file-state";
import type { ForkConfig, ChangelogPresetConfig } from "../config/types";
import type { Logger } from "../services/logger";
import type { Commit } from "../commit-parser/types";

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
async function getOldReleaseContent(filePath: string, exists: boolean): Promise<string> {
	if (exists) {
		const fileContents = await readFile(filePath, "utf8");
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

/**
 * Compares the legacy `conventional-changelog` output against the experimental changelog writer's
 * output for the same release. Returns `undefined` when they match (ignoring surrounding whitespace),
 * or a human readable description of both outputs when they differ.
 *
 * Extracted as a pure function so it can be unit tested without needing git/filesystem access.
 */
export function describeChangelogDifference(
	legacyContent: string,
	experimentalContent: string,
): string | undefined {
	if (legacyContent.trim() === experimentalContent.trim()) {
		return undefined;
	}

	return `--- conventional-changelog ---\n${legacyContent}\n--- changelog-writer (experimental) ---\n${experimentalContent}`;
}

export async function updateChangelog(
	config: ForkConfig,
	logger: Logger,
	commits: Commit[],
	previousTag: string | undefined,
	nextVersion: string,
): Promise<void> {
	if (config.skipChangelog) {
		logger.skipping("Skipping changelog update");
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
		await writeFile(changelogPath, "\n", "utf8");
	} else {
		logger.log(`Updating changelog: ${changelogPath}`);
	}

	const oldContent = await getOldReleaseContent(changelogPath, fileExists(changelogPath));
	const newContent = await getNewReleaseContent(config, logger, nextVersion);

	if (config.experimentalChangelogWriter) {
		// `changelogPresetConfig` is always fully resolved by `getUserConfig`, see `getChangelogPresetConfig`.
		const changelogWriter = new ChangelogWriter(
			config.changelogPresetConfig as ChangelogPresetConfig,
		);
		const experimentalContent = changelogWriter.generate(commits, {
			version: nextVersion,
			previousTag,
			currentTag: `${config.tagPrefix}${nextVersion}`,
		});

		const diff = describeChangelogDifference(newContent, experimentalContent);

		if (diff) {
			logger.warn(
				`[experimental-changelog-writer] The experimental changelog writer produced different output than conventional-changelog:\n${diff}`,
			);
		} else {
			logger.debug("[experimental-changelog-writer] Output matches conventional-changelog output.");
		}
	}

	if (!config.dryRun && newContent) {
		await writeFile(
			changelogPath,
			`${config.header}
${newContent}
${oldContent}
`.trim(),
			"utf8",
		);
	}
}
