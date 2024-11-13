import { parse } from "node:path";
import { readFileSync } from "node:fs";
import JoyCon from "joycon";
import { bundleRequire } from "bundle-require";

import { ForkConfigSchema } from "./schema";

/**
 * Name of the key in the package.json file that contains the users configuration.
 */
const PACKAGE_JSON_CONFIG_KEY = "fork-version";

export async function loadConfigFile(cwd: string) {
	const joycon = new JoyCon({
		cwd,
		packageKey: PACKAGE_JSON_CONFIG_KEY,
		stopDir: parse(cwd).root,
	});
	const configFilePath = await joycon.resolve([
		"fork.config.ts",
		"fork.config.js",
		"fork.config.cjs",
		"fork.config.mjs",
		"fork.config.json",
		"package.json",
	]);

	if (!configFilePath) {
		return {};
	}

	// Handle json config file.
	if (configFilePath.endsWith("json")) {
		const fileContent = JSON.parse(readFileSync(configFilePath).toString());

		// Handle package.json config file.
		if (configFilePath.endsWith("package.json")) {
			if (
				fileContent[PACKAGE_JSON_CONFIG_KEY] &&
				typeof fileContent[PACKAGE_JSON_CONFIG_KEY] === "object"
			) {
				const parsed = ForkConfigSchema.partial().safeParse(fileContent[PACKAGE_JSON_CONFIG_KEY]);
				if (!parsed.success) {
					throw new Error(`Validation error in: ${configFilePath}`, { cause: parsed.error });
				}
				return parsed.data;
			}

			return {};
		}

		const parsed = ForkConfigSchema.partial().safeParse(fileContent);
		if (!parsed.success) {
			throw new Error(`Validation error in: ${configFilePath}`, { cause: parsed.error });
		}
		return parsed.data;
	}

	// Otherwise expect config file to use js or ts.
	const fileContent = await bundleRequire({ filepath: configFilePath });

	const parsed = ForkConfigSchema.partial().safeParse(fileContent.mod.default || fileContent.mod);
	if (!parsed.success) {
		throw new Error(`Validation error in: ${configFilePath}`, { cause: parsed.error });
	}
	return parsed.data;
}
