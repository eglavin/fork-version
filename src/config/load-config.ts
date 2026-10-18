import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { basename, dirname, join, parse } from "node:path";

import { applyLegacyChangelogPresetConfig } from "./config-compatibility";
import { CONFIG_FILE_NAMES, IGNORE_DIRS, PACKAGE_JSON_CONFIG_KEY } from "./constants";
import { ForkConfigJSONSchema, ForkConfigJSSchema } from "./schema";

/**
 * Find the root of the git repository containing `cwd`, the nearest directory with a `.git`
 * directory (or a `.git` file for worktrees and submodules).
 *
 * @returns The repository root, or `undefined` if `cwd` isn't inside a git repository.
 */
function findRepositoryRoot(cwd: string): string | undefined {
	const root = parse(cwd).root;

	for (let dir = cwd; ; dir = dirname(dir)) {
		if (existsSync(join(dir, ".git"))) return dir;
		if (dir === root) return undefined;
	}
}

/**
 * Walks up from `cwd` looking for the first config file it finds.
 *
 * The search stops at the root of the git repository, or at `cwd` when not inside a repository,
 * so a config file (which may be executable javascript) outside the project is never loaded.
 *
 * @see {@link CONFIG_FILE_NAMES} List of file names to consider as a fork-version config.
 * @see {@link PACKAGE_JSON_CONFIG_KEY} Name of the key fork-version can be configured under within a `package.json` file.
 */
async function resolveConfigFile(cwd: string) {
	const stopDir = findRepositoryRoot(cwd) ?? cwd;

	for (let dir = cwd; ; dir = dirname(dir)) {
		if (IGNORE_DIRS.has(basename(dir))) return undefined;

		for (const fileName of CONFIG_FILE_NAMES) {
			const candidate = join(dir, fileName);
			if (!existsSync(candidate)) continue;

			if (fileName === "package.json") {
				const pkgContent = JSON.parse(await readFile(candidate, "utf8"));
				if (
					!pkgContent[PACKAGE_JSON_CONFIG_KEY] ||
					typeof pkgContent[PACKAGE_JSON_CONFIG_KEY] !== "object"
				) {
					continue;
				}
			}

			return candidate;
		}

		if (dir === stopDir || dir === dirname(dir)) break;
	}

	return undefined;
}

export async function loadConfigFile(cwd: string, compatWarnings: string[] = []) {
	const configFilePath = await resolveConfigFile(cwd);

	if (!configFilePath) {
		return {};
	}

	// Handle json config file.
	if (configFilePath.endsWith("json")) {
		const fileContent = JSON.parse(await readFile(configFilePath, "utf8"));

		// Handle package.json config file.
		if (configFilePath.endsWith("package.json")) {
			if (
				!fileContent[PACKAGE_JSON_CONFIG_KEY] ||
				typeof fileContent[PACKAGE_JSON_CONFIG_KEY] !== "object"
			) {
				return {};
			}

			const { config, warnings } = applyLegacyChangelogPresetConfig(
				fileContent[PACKAGE_JSON_CONFIG_KEY],
			);
			compatWarnings.push(...warnings);

			const parsed = ForkConfigJSONSchema.partial().safeParse(config);
			if (!parsed.success) {
				throw new Error(`Validation error in: ${configFilePath}`, { cause: parsed.error });
			}
			return parsed.data;
		}

		const { config, warnings } = applyLegacyChangelogPresetConfig(fileContent);
		compatWarnings.push(...warnings);

		const parsed = ForkConfigJSONSchema.partial().safeParse(config);
		if (!parsed.success) {
			throw new Error(`Validation error in: ${configFilePath}`, { cause: parsed.error });
		}
		return parsed.data;
	}

	// Otherwise expect config file to be a javascript or typescript file.
	const { createJiti } = await import("jiti");
	const jiti = createJiti(import.meta.url);
	const loaded = (await jiti.import(configFilePath)) as Record<string, unknown>;

	const { config, warnings } = applyLegacyChangelogPresetConfig(loaded.default || loaded);
	compatWarnings.push(...warnings);

	const parsed = ForkConfigJSSchema.partial().safeParse(config);
	if (!parsed.success) {
		throw new Error(`Validation error in: ${configFilePath}`, { cause: parsed.error });
	}
	return parsed.data;
}
