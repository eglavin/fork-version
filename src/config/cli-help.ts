export const helperText = `Usage:
  $ fork-version [command?] [options?]

Commands:
  main                        Bumps the version, update files, generate changelog, commit, and tag. [Default when no command is provided]
  inspect                     Print the current version and git tag, then exits.
  inspect-version             Print the current version then exits.
  inspect-tag                 Print the current git tag then exits.
  validate-config             Validates the configuration and exits.

General Options:
  --version, -v               Show the current version of Fork-Version and exit.
  --help, -h                  Show this help message and exit.

Location Options:
  --files, --file, -F         List of the files to be updated. [Default: ["bower.json", "deno.json", "deno.jsonc", "jsr.json", "jsr.jsonc", "manifest.json", "npm-shrinkwrap.json", "package-lock.json", "package.json"]]
  --glob, -G                  Glob pattern to match files to be updated.
  --path, -P                  The path Fork-Version will run from. [Default: process.cwd()]

Options:
  --changelog                 Name of the changelog file. [Default: "CHANGELOG.md"]
  --header                    The header text for the changelog.
  --release-message-format    Override the default release commit message format. [Default: "chore(release): {{currentTag}}"]
  --release-message-suffix    Add a suffix to the end of the release message.
  --tag-prefix                Specify a prefix for the created tag. [Default: "v"]
  --pre-release               Mark this release as a pre-release.
  --pre-release-tag           Mark this release with a tagged pre-release. [Example: "alpha", "beta", "rc"]
  --current-version           Override default version determination by setting the current version.
  --next-version              Override default version determination by setting the next version.
  --release-as                Override version bumping to the targeted typed. [Choices: "major", "minor", "patch"]

Flags:
  --allow-multiple-versions   Don't throw an error if multiple versions are found in the given files. [Default: true]
  --commit-all                Commit all changes, not just files updated by Fork-Version.
  --changelog-all             If this flag is set, all default commit types will be added to the changelog.
  --debug                     Output debug information.
  --dry-run                   No output will be written to disk or committed.
  --silent                    Run without logging to the terminal.
  --git-tag-fallback          If unable to find a version in the given files, fallback and attempt to use the latest git tag. [Default: true]
  --sign                      If true, git will sign the commit with the systems GPG key.
  --verify                    If true, git will run user defined git hooks before committing.
  --as-json                   Output the result as JSON.

  To negate a flag you can prefix it with "no-", for example "--no-git-tag-fallback" will not fallback to the latest git tag.

Skip Steps:
  --skip-bump                 Skip the version bump step.
  --skip-changelog            Skip updating the changelog.
  --skip-commit               Skip committing the changes.
  --skip-tag                  Skip tagging the commit.

Changelog Overrides:
  --commit-url-format         Override the default commit URL format.
  --compare-url-format        Override the default compare URL format.
  --issue-url-format          Override the default issue URL format.
  --user-url-format           Override the default user URL format.

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
