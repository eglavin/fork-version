import { resolve } from "node:path";
import { writeFile, readFile } from "node:fs/promises";

import { ChangelogWriter } from "../changelog-writer/changelog-writer";
import { fileExists } from "../utils/file-state";
import type { ForkConfig } from "../config/types";
import type { Logger } from "../services/logger";
import type { Commit } from "../commit-parser/types";
import type { WriterOptions } from "../changelog-writer/options";

/**
 * Matches the following changelog header formats:
 * - `## [1.2.3]`
 * - `<a name="1.2.3"></a>`
 */
const RELEASE_PATTERN = /(^#+ \[?[0-9]+\.[0-9]+\.[0-9]+|<a name=)/m;

/**
 * Matches a YAML front-matter block at the very start of the file.
 *
 * @example
 * ```
 * ---
 * title: Changelog
 * ---
 * ```
 */
const FRONTMATTER_PATTERN = /^---\r?\n[\s\S]*?\r?\n---[ \t]*\r?\n/;

/**
 * Read the existing changelog and split out the parts we want to keep when the file is regenerated:
 * - `frontmatter`: a YAML front-matter block at the very start of the file, if present.
 * - `oldContent`: everything from the latest release onwards.
 * @see {@link FRONTMATTER_PATTERN}
 * @see {@link RELEASE_PATTERN}
 */
async function getExistingContent(
	filePath: string,
	exists: boolean,
): Promise<{ frontmatter: string; oldContent: string }> {
	if (!exists) {
		return { frontmatter: "", oldContent: "" };
	}

	const fileContents = await readFile(filePath, "utf8");

	const frontmatterMatch = FRONTMATTER_PATTERN.exec(fileContents);
	const frontmatter = frontmatterMatch ? `${frontmatterMatch[0].trimEnd()}\n\n` : "";

	const oldContentStart = fileContents.search(RELEASE_PATTERN);
	const oldContent = oldContentStart !== -1 ? fileContents.substring(oldContentStart) : "";

	return {
		frontmatter,
		oldContent,
	};
}

/**
 * Generate the new changelog content for this release.
 */
function getNewReleaseContent(
	config: ForkConfig,
	commits: Commit[],
	previousTag: string | undefined,
	nextVersion: string,
): string {
	// `changelogWriterOptions` is always fully resolved by `getUserConfig`, see `createWriterOptions`.
	const changelogWriter = new ChangelogWriter(
		config.changelogWriterOptions as WriterOptions,
		config.types,
		config.commitParserOptions,
	);

	return changelogWriter.generate(commits, {
		version: nextVersion,
		previousTag,
		currentTag: `${config.tagPrefix}${nextVersion}`,
	});
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

	const { frontmatter, oldContent } = await getExistingContent(
		changelogPath,
		fileExists(changelogPath),
	);
	const newContent = getNewReleaseContent(config, commits, previousTag, nextVersion);

	if (!config.dryRun && newContent) {
		const updatedFileContent = `${frontmatter}${config.header}
${newContent}
${oldContent}
`.trim();

		await writeFile(changelogPath, updatedFileContent, "utf8");
	}
}
