#!/usr/bin/env node

import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { ZodError } from "zod";

import { getCliArguments } from "./config/cli-arguments";
import { getUserConfig } from "./config/user-config";
import { Logger } from "./services/logger";
import { FileManager } from "./files/file-manager";
import { Git } from "./services/git";

import { validateConfig } from "./commands/validate-config";
import { inspectVersion } from "./commands/inspect-version";
import { inspectTag } from "./commands/inspect-tag";
import { main } from "./commands/main";

async function runFork() {
	const startTime = Date.now();

	const cliArguments = getCliArguments();
	const config = await getUserConfig(cliArguments);
	const logger = new Logger(config);
	const fileManager = new FileManager(config, logger);
	const git = new Git(config);

	switch (config.command) {
		case "validate-config": {
			validateConfig(config);
			break;
		}

		case "inspect-version": {
			await inspectVersion(config, logger, fileManager, git);
			break;
		}

		case "inspect-tag": {
			await inspectTag(config, git);
			break;
		}

		case "main": {
			const result = await main(config, logger, fileManager, git);

			//#region Post-run instructions
			const branchName = await git.getBranchName();
			logger.log(
				`\nRun \`git push --follow-tags origin ${branchName}\` to push the changes and the tag.`,
			);

			if (result.current.files.some((file) => file.name === "package.json" && !file.isPrivate)) {
				const npmTag = typeof config.preRelease === "string" ? config.preRelease : "prerelease";
				logger.log(
					`${result.next.releaseType}`.startsWith("pre")
						? `Run \`npm publish --tag ${npmTag}\` to publish the package.`
						: "Run `npm publish` to publish the package.",
				);
			}
			//#endregion Post-run instructions

			if (!config.dryRun && config.debug) {
				writeFileSync(
					join(config.path, `fork-version-${Date.now()}.debug-log.json`),
					JSON.stringify(result, null, 2),
				);
			}

			break;
		}

		default: {
			console.error(`Unknown command: ${config.command}`);
			process.exit(2);
		}
	}

	logger.debug(`Completed in ${Date.now() - startTime} ms`);
}

runFork().catch((error) => {
	if (error instanceof Error) {
		// If the error is a ZodError, print the keys that failed validation
		if (error.cause instanceof ZodError) {
			console.error(error.message);
			for (const err of error.cause.issues) {
				console.log(`${err.path.join(", ")} => ${err.message}`);
			}
			process.exit(3);
		}

		console.error(error.message);
		if (error.stack) console.error(error.stack);
	} else {
		console.error(error);
	}
	process.exit(1);
});
