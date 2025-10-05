import meow from "meow";
//@ts-check

// This file is javascript so the following helper text can be extracted to the readme
// without the need for a build step, otherwise it would also be typescript...

export const helperText = `Usage:
  $ fork-version [command?] [options?]

Commands:
  main                             Bumps the version, update files, generate changelog, commit, and tag. [Default when no command is provided]
  inspect-version                  Prints the current version and exits.
  inspect-tag                      Prints the current git tag and exits.
  validate-config                  Validates the configuration and exits.

General Options:
  --version                        Show the current version of Fork-Version and exit.
  --help                           Show this help message and exit.

Location Options:
  --file, -F                       List of the files to be updated. [Default: ["bower.json", "deno.json", "deno.jsonc", "jsr.json", "jsr.jsonc", "manifest.json", "npm-shrinkwrap.json", "package-lock.json", "package.json"]]
  --glob, -G                       Glob pattern to match files to be updated.
  --path, -P                       The path Fork-Version will run from. [Default: process.cwd()]

Options:
  --changelog                      Name of the changelog file. [Default: "CHANGELOG.md"]
  --header                         The header text for the changelog.
  --tag-prefix                     Specify a prefix for the created tag. [Default: "v"]
  --pre-release                    Mark this release as a pre-release.
  --pre-release-tag                Mark this release with a tagged pre-release. [Example: "alpha", "beta", "rc"]
  --current-version                If set, Fork-Version will use this version instead of trying to determine one.
  --next-version                   If set, Fork-Version will attempt to update to this version, instead of incrementing using "conventional-commit".
  --release-as                     Release as increments the version by the specified level. [Choices: "major", "minor", "patch"]

Flags:
  --allow-multiple-versions        Don't throw an error if multiple versions are found in the given files. [Default: true]
  --commit-all                     Commit all changes, not just files updated by Fork-Version.
  --changelog-all                  If this flag is set, all default commit types will be added to the changelog.
  --debug                          Output debug information.
  --dry-run                        No output will be written to disk or committed.
  --silent                         Run without logging to the terminal.
  --git-tag-fallback               If unable to find a version in the given files, fallback and attempt to use the latest git tag. [Default: true]
  --sign                           If true, git will sign the commit with the systems GPG key.
  --verify                         If true, git will run user defined git hooks before committing.

  To negate a flag you can prefix it with "no-", for example "--no-git-tag-fallback" will not fallback to the latest git tag.

Skip Steps:
  --skip-bump                      Skip the version bump step.
  --skip-changelog                 Skip updating the changelog.
  --skip-commit                    Skip committing the changes.
  --skip-tag                       Skip tagging the commit.

Conventional Changelog Overrides:
  --commit-url-format              Override the default commit URL format.
  --compare-url-format             Override the default compare URL format.
  --issue-url-format               Override the default issue URL format.
  --user-url-format                Override the default user URL format.
  --release-commit-message-format  Override the default release commit message format.
  --release-message-suffix         Add a suffix to the end of the release message.

Exit Codes:
  0: Success
  1: General Error
  2: Unknown Command
  3: Config File Validation Error

Examples:
  $ fork-version
    Run fork-version in the current directory with default options.

  $ fork-version --path ./packages/my-package
    Run fork-version in the "./packages/my-package" directory.

  $ fork-version --file package.json --file MyApi.csproj
    Run fork-version and update the "package.json" and "MyApi.csproj" files.

  $ fork-version --glob "*/package.json"
    Run fork-version and update all "package.json" files in subdirectories.

  $ fork-version inspect-version
    Prints the current version and exits.`;

export function getCliArguments() {
	return meow(helperText, {
		importMeta: import.meta,
		booleanDefault: undefined,
		helpIndent: 0,
		flags: {
			// Commands
			/** @deprecated Set the `inspect-version` command instead. */
			inspectVersion: { type: "boolean" },

			// Options
			files: { type: "string", isMultiple: true, aliases: ["file"], shortFlag: "F" },
			glob: { type: "string", shortFlag: "G" },
			path: { type: "string", shortFlag: "P" },
			changelog: { type: "string" },
			header: { type: "string" },
			tagPrefix: { type: "string" },
			preRelease: { type: "boolean" },
			preReleaseTag: { type: "string" },
			currentVersion: { type: "string" },
			nextVersion: { type: "string" },
			releaseAs: { type: "string", choices: ["major", "minor", "patch"] },

			// Flags
			allowMultipleVersions: { type: "boolean" },
			commitAll: { type: "boolean" },
			changelogAll: { type: "boolean" },
			debug: { type: "boolean" },
			dryRun: { type: "boolean" },
			silent: { type: "boolean" },
			gitTagFallback: { type: "boolean" },
			sign: { type: "boolean" },
			verify: { type: "boolean" },

			// Skip Steps
			skipBump: { type: "boolean" },
			skipChangelog: { type: "boolean" },
			skipCommit: { type: "boolean" },
			skipTag: { type: "boolean" },

			// Changelog Overrides
			commitUrlFormat: { type: "string" },
			compareUrlFormat: { type: "string" },
			issueUrlFormat: { type: "string" },
			userUrlFormat: { type: "string" },
			releaseCommitMessageFormat: { type: "string" },
			releaseMessageSuffix: { type: "string" },
		},
	});
}
