import { z } from "zod";

export const ChangelogPresetConfigTypeSchema = z.object({
	/**
	 * The type of commit message.
	 * @example "feat", "fix", "chore", etc..
	 */
	type: z.string().describe('The type of commit message, such as "feat", "fix", "chore".'),
	/**
	 * The scope of the commit message.
	 */
	scope: z.string().optional().describe("The scope of the commit message."),
	/**
	 * The section of the `CHANGELOG` the commit should show up in.
	 */
	section: z
		.string()
		.optional()
		.describe("The section of the `CHANGELOG` the commit should show up in."),
	/**
	 * Should show in the generated changelog message?
	 */
	hidden: z.boolean().optional().describe("Should show in the generated changelog message?"),
});

export const ChangelogPresetConfigSchema = z.object({
	/**
	 * List of explicitly supported commit message types.
	 */
	types: z
		.array(ChangelogPresetConfigTypeSchema)
		.describe("List of explicitly supported commit message types."),
	/**
	 * A URL representing a specific commit at a hash.
	 * @default "{{host}}/{{owner}}/{{repository}}/commit/{{hash}}"
	 */
	commitUrlFormat: z.string().describe("A URL representing a specific commit at a hash."),
	/**
	 * A URL representing the comparison between two git SHAs.
	 * @default "{{host}}/{{owner}}/{{repository}}/compare/{{previousTag}}...{{currentTag}}"
	 */
	compareUrlFormat: z.string().describe("A URL representing the comparison between two git SHAs."),
	/**
	 * A URL representing the issue format (allowing a different URL format to be swapped in
	 * for Gitlab, Bitbucket, etc).
	 * @default "{{host}}/{{owner}}/{{repository}}/issues/{{id}}"
	 */
	issueUrlFormat: z.string().describe("A URL representing the issue format."),
	/**
	 * A URL representing a user's profile on GitHub, Gitlab, etc. This URL is used
	 * for substituting @eglavin with https://github.com/eglavin in commit messages.
	 * @default "{{host}}/{{user}}"
	 */
	userUrlFormat: z.string().describe("A URL representing a user's profile on GitHub, Gitlab, etc."),
	/**
	 * A string to be used to format the auto-generated release commit message.
	 * @default "chore(release): {{currentTag}}"
	 */
	releaseCommitMessageFormat: z
		.string()
		.describe("A string to be used to format the auto-generated release commit message."),
	/**
	 * List of prefixes used to detect references to issues.
	 * @default ["#"]
	 */
	issuePrefixes: z
		.array(z.string())
		.describe("List of prefixes used to detect references to issues."),
});

export const ForkConfigSchema = z.object({
	// Commands
	//

	/**
	 * The command to run, can be one of the following:
	 *
	 * - `main` - Bumps the version, update files, generate changelog, commit, and tag.
	 * - `inspect-version` - Prints the current version and exits.
	 * - `inspect-tag` - Prints the current git tag and exits.
	 * - `validate-config` - Validates the configuration and exits.
	 *
	 * @default "main"
	 */
	command: z
		.literal(["main", "inspect-version", "inspect-tag", "validate-config"])
		.describe(
			"The command to run. Can be one of: main, inspect-version, inspect-tag, validate-config. Defaults to main.",
		),
	/**
	 * If set, Fork-Version will print the current version and exit.
	 * @default false
	 *
	 * @deprecated Set the `inspect-version` command instead.
	 */
	inspectVersion: z
		.boolean()
		.optional()
		.describe("If set, Fork-Version will print the current version and exit."),

	// Options
	//

	/**
	 * List of the files to be updated.
	 * @default
	 * ```js
	 * ["bower.json", "deno.json", "deno.jsonc", "jsr.json", "jsr.jsonc", "manifest.json", "npm-shrinkwrap.json", "package-lock.json", "package.json"]
	 * ```
	 */
	files: z.array(z.string()).describe("List of the files to be updated."),
	/**
	 * Glob pattern to match files to be updated.
	 *
	 * Internally we're using [glob](https://github.com/isaacs/node-glob) to match files.
	 *
	 * Read more about the pattern syntax [here](https://github.com/isaacs/node-glob/tree/v10.3.12?tab=readme-ov-file#glob-primer).
	 *
	 * @default undefined
	 * @example "*.json"
	 */
	glob: z.string().optional().describe("Glob pattern to match files to be updated."),
	/**
	 * The path Fork-Version will run from.
	 * @default
	 * ```js
	 * process.cwd()
	 * ```
	 */
	path: z.string().describe('The path Fork-Version will run from. Defaults to "process.cwd()".'),
	/**
	 * Name of the changelog file.
	 * @default "CHANGELOG.md"
	 */
	changelog: z.string().describe('Name of the changelog file. Defaults to "CHANGELOG.md".'),
	/**
	 * The header text for the changelog.
	 * @default
	 * ```markdown
	 * # Changelog
	 *
	 * All notable changes to this project will be documented in this file. See [fork-version](https://github.com/eglavin/fork-version) for commit guidelines.
	 * ```
	 */
	header: z.string().describe("The header text for the changelog."),
	/**
	 * Specify a prefix for the created tag.
	 *
	 * For instance if your version tag is prefixed by "version/" instead of "v" you have to specify
	 * `tagPrefix: "version/"`.
	 *
	 * `tagPrefix` can also be used for a monorepo environment where you might want to deploy
	 * multiple package from the same repository. In this case you can specify a prefix for
	 * each package:
	 *
	 * | Example Value            | Tag Created                   |
	 * |:-------------------------|:------------------------------|
	 * | ""                       | `1.2.3`                       |
	 * | "version/"               | `version/1.2.3`               |
	 * | "@eglavin/fork-version-" | `@eglavin/fork-version-1.2.3` |
	 *
	 * @example "", "version/", "@eglavin/fork-version-"
	 * @default "v"
	 */
	tagPrefix: z.string().describe('Specify a prefix for the created tag. Defaults to "v".'),
	/**
	 * Make a pre-release with optional label if given value is a string.
	 *
	 * | Example Value | Produced Version |
	 * |:--------------|:-----------------|
	 * | true          | `1.2.3-0`        |
	 * | "alpha"       | `1.2.3-alpha-0`  |
	 * | "beta"        | `1.2.3-beta-0`   |
	 *
	 * @example true, "alpha", "beta", "rc"
	 * @default undefined
	 */
	preRelease: z
		.string()
		.or(z.boolean())
		.optional()
		.describe("Make a pre-release with optional label if given value is a string."),
	/**
	 * If set, Fork-Version will use this version instead of trying to determine one.
	 * @example "1.0.0"
	 * @default undefined
	 */
	currentVersion: z
		.string()
		.optional()
		.describe("If set, Fork-Version will use this version instead of trying to determine one."),
	/**
	 * If set, Fork-Version will attempt to update to this version, instead of incrementing using "conventional-commit".
	 * @example "2.0.0"
	 * @default undefined
	 */
	nextVersion: z
		.string()
		.optional()
		.describe(
			'If set, Fork-Version will attempt to update to this version, instead of incrementing using "conventional-commit".',
		),
	/**
	 * Release as increments the version by the specified level. Overrides the default behaviour of "conventional-commit".
	 * @example "major", "minor", "patch"
	 * @default undefined
	 */
	releaseAs: z
		.union([z.literal("major"), z.literal("minor"), z.literal("patch")])
		.optional()
		.describe(
			'Release as increments the version by the specified level. Overrides the default behaviour of "conventional-commit".',
		),

	// Flags
	//

	/**
	 * Don't throw an error if multiple versions are found in the given files.
	 * @default true
	 */
	allowMultipleVersions: z
		.boolean()
		.describe("Don't throw an error if multiple versions are found in the given files."),
	/**
	 * Commit all changes, not just files updated by Fork-Version.
	 * @default false
	 */
	commitAll: z.boolean().describe("Commit all changes, not just files updated by Fork-Version."),
	/**
	 * By default the conventional-changelog spec will only add commit types of `feat` and `fix` to the generated changelog.
	 * If this flag is set, all [default commit types](https://github.com/conventional-changelog/conventional-changelog-config-spec/blob/238093090c14bd7d5151eb5316e635623ce633f9/versions/2.2.0/schema.json#L18)
	 * will be added to the changelog.
	 * @default false
	 */
	changelogAll: z
		.boolean()
		.describe(
			"If this flag is set, all default commit types will be added to the changelog, not just `feat` and `fix`.",
		),
	/**
	 * Output debug information.
	 * @default false
	 */
	debug: z.boolean().describe("Output debug information."),
	/**
	 * No output will be written to disk or committed.
	 * @default false
	 */
	dryRun: z.boolean().describe("No output will be written to disk or committed."),
	/**
	 * Run without logging to the terminal.
	 * @default false
	 */
	silent: z.boolean().describe("Run without logging to the terminal."),
	/**
	 * If unable to find a version in the given files, fallback and attempt to use the latest git tag.
	 * @default true
	 */
	gitTagFallback: z
		.boolean()
		.describe(
			"If unable to find a version in the given files, fallback and attempt to use the latest git tag. Defaults to true.",
		),
	/**
	 * If true, git will sign the commit with the systems GPG key.
	 * @see {@link https://git-scm.com/docs/git-commit#Documentation/git-commit.txt--Sltkeyidgt Git - GPG Sign Commits}
	 * @default false
	 */
	sign: z.boolean().describe("If true, git will sign the commit with the systems GPG key."),
	/**
	 * If true, git will run user defined git hooks before committing.
	 * @see {@link https://git-scm.com/docs/githooks Git - Git Hooks}
	 * @default false
	 */
	verify: z.boolean().describe("If true, git will run user defined git hooks before committing."),

	// Skip Steps
	//

	/**
	 * Skip the bump step.
	 * @default false
	 */
	skipBump: z.boolean().describe("Skip the bump step."),
	/**
	 * Skip the changelog step.
	 * @default false
	 */
	skipChangelog: z.boolean().describe("Skip the changelog step."),
	/**
	 * Skip the commit step.
	 * @default false
	 */
	skipCommit: z.boolean().describe("Skip the commit step."),
	/**
	 * Skip the tag step.
	 * @default false
	 */
	skipTag: z.boolean().describe("Skip the tag step."),

	/**
	 * Override the default "conventional-changelog-conventionalcommits" preset configuration.
	 */
	changelogPresetConfig: ChangelogPresetConfigSchema.partial().describe(
		'Override the default "conventional-changelog-conventionalcommits" preset configuration.',
	),

	/**
	 * Add a suffix to the release commit message.
	 * @example "[skip ci]"
	 */
	releaseMessageSuffix: z
		.string()
		.optional()
		.describe("Add a suffix to the release commit message."),
});
