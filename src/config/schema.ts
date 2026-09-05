import { z } from "zod";

/**
 * Per-field metadata used to derive the `node:util` `parseArgs` options (see `./cli-schema.ts`).
 *
 * This lives in a dedicated registry rather than `.meta()` so it never leaks into the generated
 * JSON schema (`z.toJSONSchema` only reads the global registry).
 */
export interface CliOptionMeta {
	/**
	 * Single-character short flag, e.g. `F` for `-F`.
	 */
	short?: string;
	/**
	 * Additional long flag that maps onto the same config key, e.g. `file` for `files`.
	 */
	alias?: string;
	/**
	 * Boolean indicating if this option can be used through the command line.
	 */
	hidden?: boolean;
}

export const cliOptionRegistry = z.registry<CliOptionMeta>();

export const CommitTypeSchema = z.object({
	type: z.string().describe('The type of commit message. Example: "feat", "fix", etc..'),
	scope: z.string().optional().describe("The scope of the commit message."),
	section: z
		.string()
		.optional()
		.describe(
			'The section of the `CHANGELOG` the commit should show up in. Example: "Features", "Bug Fixes", etc..',
		),
	hidden: z
		.boolean()
		.optional()
		.describe("Boolean indication if this type should show in the generated changelog message."),
});

export const WriterOptionsSchema = z.object({
	commitUrlFormat: z.string().describe("A URL representing a specific commit at a hash."),
	compareUrlFormat: z.string().describe("A URL representing the comparison between two git SHAs."),
	issueUrlFormat: z.string().describe("A URL representing the issue format."),
	userUrlFormat: z.string().describe("A URL representing a user's profile on GitHub, Gitlab, etc."),
});

export const ForkConfigJSONSchema = z.object({
	// Commands
	//

	command: z
		.literal(["main", "inspect", "inspect-version", "inspect-tag", "validate-config"])
		.describe(
			'The command to run. Can be one of: main, inspect, inspect-version, inspect-tag, validate-config. Default: "main"',
		)
		.register(cliOptionRegistry, { hidden: true }),
	inspectVersion: z
		.boolean()
		.optional()
		.describe("[Deprecated] If set, Fork-Version will print the current version and exit."),

	// Options
	//

	files: z
		.array(z.string())
		.describe("List of the files to be updated.")
		.register(cliOptionRegistry, { short: "F", alias: "file" }),
	glob: z
		.string()
		.optional()
		.describe("Glob pattern to match files to be updated.")
		.register(cliOptionRegistry, { short: "G" }),
	path: z
		.string()
		.describe("The path Fork-Version will run from. Default: `process.cwd()`")
		.register(cliOptionRegistry, { short: "P" }),
	changelog: z.string().describe('Name of the changelog file. Default: "CHANGELOG.md"'),
	header: z.string().describe("The header text for the changelog."),
	types: z.array(CommitTypeSchema).describe("List of explicitly supported commit message types."),
	releaseMessageFormat: z
		.string()
		.describe("A string to be used to format the auto-generated release commit message."),
	releaseMessageSuffix: z
		.string()
		.optional()
		.describe("Add a suffix to the release commit message."),
	tagPrefix: z.string().describe('Specify a prefix for the created tag. Default: "v"'),
	preRelease: z
		.string()
		.or(z.boolean())
		.optional()
		.describe(
			'Make a pre-release with an optional label if the given value is a string. Example: true, "alpha", "beta"',
		),
	currentVersion: z
		.string()
		.optional()
		.describe("Override default version determination by setting the current version."),
	nextVersion: z
		.string()
		.optional()
		.describe("Override default version determination by setting the next version."),
	releaseAs: z
		.union([z.literal("major"), z.literal("minor"), z.literal("patch")])
		.optional()
		.describe("Override version bumping to the targeted typed."),

	// Flags
	//

	allowMultipleVersions: z
		.boolean()
		.describe(
			"Don't throw an error if multiple versions are found in the given files. Default: `true`",
		),
	commitAll: z.boolean().describe("Commit all changes, not just files updated by Fork-Version."),
	changelogAll: z
		.boolean()
		.describe(
			"If this flag is set, all default commit types will be added to the changelog, not just `feat` and `fix`.",
		),
	debug: z.boolean().describe("Output debug information."),
	dryRun: z.boolean().describe("No output will be written to disk or committed."),
	silent: z.boolean().describe("Run without logging to the terminal."),
	gitTagFallback: z
		.boolean()
		.describe(
			"If unable to find a version in the given files, fallback and attempt to use the latest git tag. Default: `true`",
		),
	sign: z.boolean().describe("If true, git will sign the commit with the systems GPG key."),
	verify: z.boolean().describe("If true, git will run user defined git hooks before committing."),
	asJson: z.boolean().describe("Print inspected output as a parsable json string."),

	// Skip Steps
	//

	skipBump: z.boolean().describe("Skip the bump step."),
	skipChangelog: z.boolean().describe("Skip the changelog step."),
	skipCommit: z.boolean().describe("Skip the commit step."),
	skipTag: z.boolean().describe("Skip the tag step."),

	// Parser Options
	//

	detectedGitHost: z
		.string()
		.optional()
		.describe(
			"The detected git host, such as GitHub, GitLab, Bitbucket, Azure Devops, the remote's origin URL for any other git host, or undefined if there's no git remote at all.",
		)
		.register(cliOptionRegistry, { hidden: true }),
	commitParserOptions: z.looseObject({}).optional().describe("Options to pass to commits parser."),
	changelogWriterOptions: WriterOptionsSchema.partial()
		.optional()
		.describe("Override the commit types and URL formats used when generating the changelog."),
});

export const CustomFileManagerSchema = z.looseObject({
	read: z.function(),
	write: z.function(),
	isSupportedFile: z.function(),
});

export const ForkConfigJSSchema = ForkConfigJSONSchema.partial().extend({
	customFileManagers: z
		.array(CustomFileManagerSchema)
		.describe("List of custom file managers to use. See documentation for details."),
});

/**
 * Omit `Command` from user config validation as its handled by the cli.ts file.
 */
export const UserConfigSchema = ForkConfigJSONSchema.omit({ command: true });
