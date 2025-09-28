#!/usr/bin/env node

import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { ZodError } from "zod";

import { getCliArguments } from "./config/cli-arguments";
import { getUserConfig } from "./config/user-config";
import { Logger } from "./utils/logger";
import { FileManager } from "./files/file-manager";
import { Git } from "./utils/git";

import { getCommitsSinceTag } from "./process/get-commits";
import { getCurrentVersion, getNextVersion } from "./process/version";
import { updateChangelog } from "./process/changelog";
import { commitChanges } from "./process/commit";
import { tagChanges } from "./process/tag";

async function runFork(cliArguments: ReturnType<typeof getCliArguments>) {
	const startTime = Date.now();

	const config = await getUserConfig(cliArguments);

	const logger = new Logger(config);
	const fileManager = new FileManager(config, logger);
	const git = new Git(config);

	logger.log(`Running fork-version - ${new Date().toUTCString()}`);
	logger.warn(config.dryRun ? "[Dry Run] No changes will be written to disk.\n" : "");

	const commits = await getCommitsSinceTag(config, logger, git);

	const current = await getCurrentVersion(config, logger, git, fileManager, config.files);
	const next = await getNextVersion(config, logger, commits.commits, current.version);

	logger.log("Updating files: ");
	for (const outFile of current.files) {
		logger.log(`  - ${outFile.path}`);

		fileManager.write(outFile, next.version);
	}

	await updateChangelog(config, logger, next.version);
	await commitChanges(config, logger, git, current.files, next.version);
	await tagChanges(config, logger, git, next.version);

	// Print git push command
	const branchName = await git.getBranchName();
	logger.log(
		`\nRun \`git push --follow-tags origin ${branchName}\` to push the changes and the tag.`,
	);

	// Print npm publish command
	if (current.files.some((file) => file.name === "package.json" && file.isPrivate === false)) {
		const npmTag = typeof config.preRelease === "string" ? config.preRelease : "prerelease";
		logger.log(
			`${next.releaseType}`.startsWith("pre")
				? `Run \`npm publish --tag ${npmTag}\` to publish the package.`
				: "Run `npm publish` to publish the package.",
		);
	}

	logger.debug(`Completed in ${Date.now() - startTime} ms`);

	const result = {
		config,
		current,
		next,
	};

	if (!config.dryRun && config.debug) {
		writeFileSync(
			join(config.path, `fork-version-${Date.now()}.debug-log.json`),
			JSON.stringify(result, null, 2),
		);
	}

	return result;
}

const cliArguments = getCliArguments();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
runFork(cliArguments).catch((error: Error | any) => {
	if (error instanceof Error) {
		// If the error is a ZodError, print the keys that failed validation
		if (error.cause instanceof ZodError) {
			console.error(error.message);
			for (const err of error.cause.errors) {
				console.log(`${err.path} => ${err.message}`);
			}
			process.exit(3);
		}

		if (error.stack) {
			console.error(error.stack);
		} else {
			console.error(error.message);
		}
	} else {
		console.error(error);
	}
	process.exit(1);
});
