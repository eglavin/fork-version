import type { getCliArguments } from "./cli-arguments";
import type { ParserOptions } from "../commit-parser/options";
import type { IFileManager } from "../files/file-manager";

export interface ChangelogPresetConfigType {
	/**
	 * The type of commit message.
	 * @example "feat", "fix", "chore", etc..
	 */
	type: string;
	/**
	 * The scope of the commit message.
	 */
	scope?: string;
	/**
	 * The section of the `CHANGELOG` the commit should show up in.
	 */
	section?: string;
	/**
	 * Should show in the generated changelog message?
	 */
	hidden?: boolean;
}

export interface ChangelogPresetConfig {
	/**
	 * List of explicitly supported commit message types.
	 */
	types: ChangelogPresetConfigType[];
	/**
	 * A URL representing a specific commit at a hash.
	 * @default "{{host}}/{{owner}}/{{repository}}/commit/{{hash}}"
	 */
	commitUrlFormat: string;
	/**
	 * A URL representing the comparison between two git SHAs.
	 * @default "{{host}}/{{owner}}/{{repository}}/compare/{{previousTag}}...{{currentTag}}"
	 */
	compareUrlFormat: string;
	/**
	 * A URL representing the issue format (allowing a different URL format to be swapped in
	 * for Gitlab, Bitbucket, etc).
	 * @default "{{host}}/{{owner}}/{{repository}}/issues/{{id}}"
	 */
	issueUrlFormat: string;
	/**
	 * A URL representing a user's profile on GitHub, Gitlab, etc. This URL is used
	 * for substituting @eglavin with https://github.com/eglavin in commit messages.
	 * @default "{{host}}/{{user}}"
	 */
	userUrlFormat: string;
	/**
	 * A string to be used to format the auto-generated release commit message.
	 * @default "chore(release): {{currentTag}}"
	 */
	releaseCommitMessageFormat: string;
	/**
	 * List of prefixes used to detect references to issues.
	 * @default ["#"]
	 */
	issuePrefixes: string[];
}

export interface ForkConfig {
	// Commands
	//

	/**
	 * The command to run, can be one of the following:
	 *
	 * - `main` - Bumps the version, update files, generate changelog, commit, and tag.
	 * - `inspect-version` - Prints the current version and exits.
	 * - `inspect-tag` - Prints the current git tag and exits.
	 * - `inspect` - Prints the current version and git tag and exits.
	 * - `validate-config` - Validates the configuration and exits.
	 *
	 * @default "main"
	 */
	command: "main" | "inspect" | "inspect-version" | "inspect-tag" | "validate-config";
	/**
	 * If set, Fork-Version will print the current version and exit.
	 * @default false
	 *
	 * @deprecated Set the `inspect-version` command instead.
	 */
	inspectVersion?: boolean;

	// Options
	//

	/**
	 * List of the files to be updated.
	 * @default
	 * ```js
	 * ["bower.json", "deno.json", "deno.jsonc", "jsr.json", "jsr.jsonc", "manifest.json", "npm-shrinkwrap.json", "package-lock.json", "package.json"]
	 * ```
	 */
	files: string[];
	/**
	 * List of custom file managers to use. See documentation for details.
	 * @default undefined
	 */
	customFileManagers?: IFileManager[];
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
	glob?: string;
	/**
	 * The path Fork-Version will run from.
	 * @default
	 * ```js
	 * process.cwd()
	 * ```
	 */
	path: string;
	/**
	 * Name of the changelog file.
	 * @default "CHANGELOG.md"
	 */
	changelog: string;
	/**
	 * The header text for the changelog.
	 * @default
	 * ```markdown
	 * # Changelog
	 *
	 * All notable changes to this project will be documented in this file. See [fork-version](https://github.com/eglavin/fork-version) for commit guidelines.
	 * ```
	 */
	header: string;
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
	tagPrefix: string;
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
	preRelease?: string | boolean;
	/**
	 * If set, Fork-Version will use this version instead of trying to determine one.
	 * @example "1.0.0"
	 * @default undefined
	 */
	currentVersion?: string;
	/**
	 * If set, Fork-Version will attempt to update to this version, instead of incrementing using "conventional-commit".
	 * @example "2.0.0"
	 * @default undefined
	 */
	nextVersion?: string;
	/**
	 * Release as increments the version by the specified level. Overrides the default behaviour of "conventional-commit".
	 * @example "major", "minor", "patch"
	 * @default undefined
	 */
	releaseAs?: "major" | "minor" | "patch";

	// Flags
	//

	/**
	 * Don't throw an error if multiple versions are found in the given files.
	 * @default true
	 */
	allowMultipleVersions: boolean;
	/**
	 * Commit all changes, not just files updated by Fork-Version.
	 * @default false
	 */
	commitAll: boolean;
	/**
	 * By default the conventional-changelog spec will only add commit types of `feat` and `fix` to the generated changelog.
	 * If this flag is set, all [default commit types](https://github.com/conventional-changelog/conventional-changelog-config-spec/blob/238093090c14bd7d5151eb5316e635623ce633f9/versions/2.2.0/schema.json#L18)
	 * will be added to the changelog.
	 * @default false
	 */
	changelogAll: boolean;
	/**
	 * Output debug information.
	 * @default false
	 */
	debug: boolean;
	/**
	 * No output will be written to disk or committed.
	 * @default false
	 */
	dryRun: boolean;
	/**
	 * Run without logging to the terminal.
	 * @default false
	 */
	silent: boolean;
	/**
	 * If unable to find a version in the given files, fallback and attempt to use the latest git tag.
	 * @default true
	 */
	gitTagFallback: boolean;
	/**
	 * If true, git will sign the commit with the systems GPG key.
	 * @see {@link https://git-scm.com/docs/git-commit#Documentation/git-commit.txt--Sltkeyidgt Git - GPG Sign Commits}
	 * @default false
	 */
	sign: boolean;
	/**
	 * If true, git will run user defined git hooks before committing.
	 * @see {@link https://git-scm.com/docs/githooks Git - Git Hooks}
	 * @default false
	 */
	verify: boolean;
	/**
	 * Print inspected output as a parsable json string.
	 * @default false
	 */
	asJson: boolean;

	// Skip Steps
	//

	/**
	 * Skip the bump step.
	 * @default false
	 */
	skipBump: boolean;
	/**
	 * Skip the changelog step.
	 * @default false
	 */
	skipChangelog: boolean;
	/**
	 * Skip the commit step.
	 * @default false
	 */
	skipCommit: boolean;
	/**
	 * Skip the tag step.
	 * @default false
	 */
	skipTag: boolean;

	// Parser Options
	//

	/**
	 * The detected git host:
	 * - `GitHub`
	 * - `GitLab`
	 * - `Bitbucket`
	 * - `Azure Devops`
	 * - Or undefined if unknown or not detected.
	 */
	detectedGitHost?: string;
	/**
	 * Override the default "conventional-changelog-conventionalcommits" preset configuration.
	 */
	changelogPresetConfig?: Partial<ChangelogPresetConfig>;
	/**
	 * Add a suffix to the release commit message.
	 * @example "[skip ci]"
	 */
	releaseMessageSuffix?: string;
	/**
	 * Options to pass to commits parser.
	 */
	commitParserOptions?: Partial<ParserOptions>;
}

export type Config = Partial<ForkConfig>;

type CLIArguments = ReturnType<typeof getCliArguments>;

export interface ForkVersionCLIArgs {
	input: CLIArguments["input"];
	flags: Partial<CLIArguments["flags"]>;
}
