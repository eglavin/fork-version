/**
 * Key on a `package.json` under which Fork-Version configuration may be placed, e.g.
 * ```json
 * {
 *   "name": "fork-version",
 *   "version": "1.2.3",
 *   "fork-version": {
 *     "commitAll": true
 *   }
 * }
 * ```
 */
export const PACKAGE_JSON_CONFIG_KEY = "fork-version";

/**
 * Config file names in resolution priority order. `loadConfigFile` searches `cwd` and then each
 * parent directory, using the first file that exists. A `package.json` only counts if it has a
 * {@link PACKAGE_JSON_CONFIG_KEY} key.
 */
export const CONFIG_FILE_NAMES = [
	"fork.config.ts",
	"fork.config.js",
	"fork.config.cjs",
	"fork.config.mjs",
	"fork.config.json",
	"package.json",
] as const;

/**
 * Directory names fork-version should not be working in.
 */
export const IGNORE_DIRS = new Set(["node_modules", ".git"]);

/**
 * Commands that only print information and exit. These are commonly used in scripts, e.g.
 * `VERSION=$(fork-version inspect-version)`, so we suppress Node's `ExperimentalWarning`s (for
 * `util.styleText` and `fs.promises.glob`) to keep their output clean.
 */
export const INSPECT_COMMANDS = new Set(["inspect", "inspect-version", "inspect-tag"]);

/**
 * Keys on the `parseArgs` result that are not copied onto the resolved `flags` object: `help` and
 * `version` are actioned before the config is built, and `file` / `files` are merged together by
 * hand.
 */
export const NON_FLAG_ARG_KEYS = new Set(["help", "version", "file", "files"]);

/**
 * Zod v4 `def.type` discriminators for schemas that wrap another schema on `def.innerType`
 * (`z.string().optional()`, `.default()`, etc.). `scalarKind` peels these off to reach the
 * underlying type.
 */
export const ZOD_WRAPPER_TYPES = new Set([
	"optional",
	"nullable",
	"default",
	"prefault",
	"readonly",
	"nonoptional",
]);
