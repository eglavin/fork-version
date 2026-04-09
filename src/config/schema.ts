import { z } from "zod";

export const ChangelogPresetConfigTypeSchema = z.object({
	type: z.string().describe('The type of commit message, such as "feat", "fix", "chore".'),
	scope: z.string().optional().describe("The scope of the commit message."),
	section: z
		.string()
		.optional()
		.describe("The section of the `CHANGELOG` the commit should show up in."),
	hidden: z.boolean().optional().describe("Should show in the generated changelog message?"),
});

export const ChangelogPresetConfigSchema = z.object({
	types: z
		.array(ChangelogPresetConfigTypeSchema)
		.describe("List of explicitly supported commit message types."),
	commitUrlFormat: z.string().describe("A URL representing a specific commit at a hash."),
	compareUrlFormat: z.string().describe("A URL representing the comparison between two git SHAs."),
	issueUrlFormat: z.string().describe("A URL representing the issue format."),
	userUrlFormat: z.string().describe("A URL representing a user's profile on GitHub, Gitlab, etc."),
	releaseCommitMessageFormat: z
		.string()
		.describe("A string to be used to format the auto-generated release commit message."),
	issuePrefixes: z
		.array(z.string())
		.describe("List of prefixes used to detect references to issues."),
});

export const ForkConfigSchema = z.object({
	// Commands
	//

	command: z
		.literal(["main", "inspect", "inspect-version", "inspect-tag", "validate-config"])
		.describe(
			"The command to run. Can be one of: main, inspect, inspect-version, inspect-tag, validate-config. Defaults to main.",
		),
	inspectVersion: z
		.boolean()
		.optional()
		.describe("If set, Fork-Version will print the current version and exit."),

	// Options
	//

	files: z.array(z.string()).describe("List of the files to be updated."),
	glob: z.string().optional().describe("Glob pattern to match files to be updated."),
	path: z.string().describe('The path Fork-Version will run from. Defaults to "process.cwd()".'),
	changelog: z.string().describe('Name of the changelog file. Defaults to "CHANGELOG.md".'),
	header: z.string().describe("The header text for the changelog."),
	tagPrefix: z.string().describe('Specify a prefix for the created tag. Defaults to "v".'),
	preRelease: z
		.string()
		.or(z.boolean())
		.optional()
		.describe("Make a pre-release with optional label if given value is a string."),
	currentVersion: z
		.string()
		.optional()
		.describe("If set, Fork-Version will use this version instead of trying to determine one."),
	nextVersion: z
		.string()
		.optional()
		.describe(
			'If set, Fork-Version will attempt to update to this version, instead of incrementing using "conventional-commit".',
		),
	releaseAs: z
		.union([z.literal("major"), z.literal("minor"), z.literal("patch")])
		.optional()
		.describe(
			'Release as increments the version by the specified level. Overrides the default behaviour of "conventional-commit".',
		),

	// Flags
	//

	allowMultipleVersions: z
		.boolean()
		.describe("Don't throw an error if multiple versions are found in the given files."),
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
			"If unable to find a version in the given files, fallback and attempt to use the latest git tag. Defaults to true.",
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
			"The detected git host, such as GitHub, GitLab, Bitbucket, Azure Devops, or undefined if unknown or not detected.",
		),
	changelogPresetConfig: ChangelogPresetConfigSchema.partial()
		.optional()
		.describe(
			'Override the default "conventional-changelog-conventionalcommits" preset configuration.',
		),
	releaseMessageSuffix: z
		.string()
		.optional()
		.describe("Add a suffix to the release commit message."),
	commitParserOptions: z.looseObject({}).optional().describe("Options to pass to commits parser."),
});
