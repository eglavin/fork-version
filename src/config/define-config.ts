import type { Config } from "./types";

/**
 * Optional helper function to enable intellisense and type checking when defining a Fork-Version configuration object.
 *
 * [Fork-Version - Config Options](https://github.com/eglavin/fork-version/blob/main/docs/Configuration.md#config-options)
 *
 * @example
 * ```ts
 * // File: fork.config.ts
 * import { defineConfig } from "fork-version";
 *
 * export default defineConfig({
 *   header: "# Changelog\n\nMy Custom Changelog Header",
 * });
 * ```
 *
 * @param config The configuration object to be defined.
 * @returns The same configuration object that was passed in.
 */
export function defineConfig(config: Config): Config {
	return config;
}
