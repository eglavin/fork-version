import { join, resolve } from "node:path";
import { glob } from "node:fs/promises";

import { createWriterOptions } from "../changelog-writer/options";
import { applyLegacyCliFlags } from "./config-compatibility";
import { DEFAULT_CONFIG } from "./defaults";
import { detectGitHost } from "../detect-git-host/detect-git-host";
import { loadConfigFile } from "./load-config";
import { mergeFiles } from "./merge-files";
import type { ForkVersionCLIArgs, ForkConfig } from "./types";

export async function getUserConfig(
	cliArguments: ForkVersionCLIArgs,
	compatWarnings: string[] = [],
): Promise<ForkConfig> {
	const cwd = cliArguments.flags.path ? resolve(cliArguments.flags.path) : process.cwd();

	const configFile = await loadConfigFile(cwd, compatWarnings);

	const { flags, warnings } = applyLegacyCliFlags(cliArguments.flags);
	compatWarnings.push(...warnings);

	const mergedConfig = {
		...DEFAULT_CONFIG,
		...configFile,
		...flags,
	} as ForkConfig;

	const globResults: string[] = [];
	if (mergedConfig.glob) {
		const IGNORE_LIST = new Set(["node_modules", ".git"]);

		const entries = glob(mergedConfig.glob, {
			cwd,
			withFileTypes: true,
			exclude: (entry) => IGNORE_LIST.has(entry.name),
		});

		for await (const entry of entries) {
			if (entry.isFile()) {
				globResults.push(join(entry.parentPath, entry.name));
			}
		}
	}

	const files = mergeFiles(configFile?.files, cliArguments.flags.files, globResults);
	const detectedGitHost = await detectGitHost(cwd);

	let command: ForkConfig["command"] = DEFAULT_CONFIG.command;
	if (cliArguments.input.length > 0 && cliArguments.input[0].trim()) {
		command = cliArguments.input[0].trim().toLowerCase() as ForkConfig["command"];
	} else if (mergedConfig.command.trim()) {
		command = mergedConfig.command.trim().toLowerCase() as ForkConfig["command"];
	}

	// Support deprecated `--inspect-version` flag. Will be removed in a future major release.
	if (mergedConfig.inspectVersion) {
		command = "inspect-version";
	}

	// Force silent mode to avoid printing unnecessary information when running other commands.
	const shouldBeSilent = ![DEFAULT_CONFIG.command].includes(command);

	return {
		...mergedConfig,

		command,

		// Options
		files,
		path: cwd,
		// If the user has requested to see all types, remove the hidden flag from any hidden types
		// so they show up in the changelog under a catch-all "Other Changes" section.
		types: mergedConfig.changelogAll
			? mergedConfig.types.map((type) => {
					if (!type.hidden) return type;
					return { ...type, section: type.section || "Other Changes", hidden: false };
				})
			: mergedConfig.types,
		releaseMessageFormat: mergedConfig.releaseMessageSuffix
			? `${mergedConfig.releaseMessageFormat} ${mergedConfig.releaseMessageSuffix}`
			: mergedConfig.releaseMessageFormat,
		preRelease:
			// Meow doesn't support multiple flags with the same name, so we need to check both.
			cliArguments.flags.preReleaseTag ?? cliArguments.flags.preRelease ?? configFile.preRelease,

		//Flags
		silent: shouldBeSilent || mergedConfig.silent,

		// Parser Options
		detectedGitHost: detectedGitHost?.hostName,
		commitParserOptions: {
			...detectedGitHost?.commitParser,
			...mergedConfig.commitParserOptions,
		},
		changelogWriterOptions: createWriterOptions(
			mergedConfig,
			cliArguments.flags,
			detectedGitHost?.changelogWriter,
		),
	};
}
