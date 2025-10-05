import { resolve } from "node:path";
import { glob } from "glob";

import { getChangelogPresetConfig } from "./changelog-preset-config";
import { DEFAULT_CONFIG } from "./defaults";
import { detectGitHost } from "./detect-git-host";
import { loadConfigFile } from "./load-config";
import { mergeFiles } from "./merge-files";
import type { ForkVersionCLIArgs, ForkConfig } from "./types";

export async function getUserConfig(cliArguments: ForkVersionCLIArgs): Promise<ForkConfig> {
	const cwd = cliArguments.flags.path ? resolve(cliArguments.flags.path) : process.cwd();

	const configFile = await loadConfigFile(cwd);

	const mergedConfig = {
		...DEFAULT_CONFIG,
		...configFile,
		...cliArguments.flags,
	} as ForkConfig;

	let globResults: string[] = [];
	if (mergedConfig.glob) {
		globResults = await glob(mergedConfig.glob, {
			cwd,
			ignore: ["node_modules/**"],
			nodir: true,
		});
	}

	const files = mergeFiles(configFile?.files, cliArguments.flags.files, globResults);
	const detectedGitHost = await detectGitHost(cwd);
	const changelogPresetConfig = getChangelogPresetConfig(
		mergedConfig,
		cliArguments.flags,
		detectedGitHost,
	);

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
		files,
		path: cwd,
		preRelease:
			// Meow doesn't support multiple flags with the same name, so we need to check both.
			cliArguments.flags.preReleaseTag ?? cliArguments.flags.preRelease ?? configFile.preRelease,
		silent: shouldBeSilent || mergedConfig.silent,
		changelogPresetConfig,
	};
}
