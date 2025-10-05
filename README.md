# Fork-Version

[![NPM Version](https://img.shields.io/npm/v/fork-version)](https://www.npmjs.com/package/fork-version)
[![JSR](https://jsr.io/badges/@eglavin/fork-version)](https://jsr.io/@eglavin/fork-version)
[![Version Package](https://github.com/eglavin/fork-version/actions/workflows/version.yml/badge.svg)](https://github.com/eglavin/fork-version/actions/workflows/version.yml)
[![Publish Package](https://github.com/eglavin/fork-version/actions/workflows/release.yml/badge.svg)](https://github.com/eglavin/fork-version/actions/workflows/release.yml)

<p align="center">
  <img src="assets/fork-version-logo.svg" alt="Fork Version Icon" width="200px">
</p>

<p align="center">
Fork-Version automates version control tasks such as determining, updating, and committing versions, files, and changelogs, simplifying the versioning process when adhering to the <a href="https://www.conventionalcommits.org">conventional commit</a> standard.
</p>

<details>
<summary>This project is essentially a complete re-write of <a href=https://github.com/conventional-changelog/standard-version>standard-version</a> following on from its deprecation in May 2022.</summary>
Although there are many alternatives such as <a href=https://github.com/googleapis/release-please>release-please</a>. This project aims to continue focusing on just the versioning and changelog generation aspect of the process for use in other Git hosts outside of Github.
</details>

## What Does Fork-Version Do?

By following the [conventional commit](https://www.conventionalcommits.org) standard Fork-Version can automate the following tasks for you:

1. Determine the current and next version
1. Update the version in the selected files [(View the supported files)](#supported-file-types)
1. Update your changelog
1. Commit the changed files
1. Create a tag for the new version

Fork-Version won't attempt to push changes to git or to a package manager, this allows you to decide how you publish your changes.

## Using Fork-Version

Primarily designed to be used with `npx`, Fork-Version can also be installed globally or directly to the node package you're working on. The only software prerequisites you need are [git](https://git-scm.com) and [node](https://nodejs.org).

Fork-Version can be configured either through a config file or by passing options to the tool when ran, see the [Configuration File](#configuration-file) and [Command Line Options](#command-line-options) sections below for details on the supported options.

> [!NOTE]
> Command line options get merged with config file options, any options that are declared through the cli will override options that are also in the config file (Except for the list of [files](#configfiles) which get merged).

### Using `npx` (Recommended)

To use Fork-Version without installation you can use `npx`:

```sh
npx fork-version
```

`npx` is a package runner which allows you to execute npm packages without installation, this can be useful when working on projects outside of the Node ecosystem.

> [!NOTE]
> By default `npx` will use the latest release, if you want to use a specific version you can add a version tag to the end of the name.
>
> Example: `npx fork-version@1.7.0`
>
> The version tag needs to match against one of the [published versions on npm](https://www.npmjs.com/package/fork-version?activeTab=versions).

Alternatively you can use other npm compatible javascript runtime's:

| Runner | Command                    |
| ------ | -------------------------- |
| bun    | `bunx fork-version`        |
| deno   | `deno -A npm:fork-version` |

### Install Locally

To install the package locally to your project you can use one of the following commands:

| Package Manager | Install Command                       |
| --------------- | ------------------------------------- |
| npm             | `npm install fork-version --save-dev` |
| yarn            | `yarn add fork-version --dev`         |
| pnpm            | `pnpm add fork-version --save-dev`    |
| bun             | `bun install fork-version --dev`      |

You can then add the following entry to your package.json scripts section and use it like any other script you already use in your project.

```json
// package.json
{
  "scripts": {
    "release": "fork-version"
  }
}
```

For example if you use npm you can now use `npm run release` to run Fork-Version.

### Commands

Fork-Version has a number of command modes which will make the program behave differently. The default "command" is the `main` mode, this mode will be used when no other command is defined.

| Command             | Description                                                            |
| ------------------- | ---------------------------------------------------------------------- |
| `main`              | Bumps the version, update files, generate changelog, commits, and tag. |
| `inspect-version`   | Prints the current version and exit.                                   |
| `inspect-tag`       | Prints the current git tag and exit.                                   |
| `validate-config`   | Validates the configuration and exit.                                  |

### Exit Codes

When ran as a cli tool Fork-Version will exit with one of the following exit codes:

| Exit Code | Description                  |
| --------- | ---------------------------- |
| 0         | Success                      |
| 1         | General Error                |
| 2         | Unknown Command              |
| 3         | Config File Validation Error |

### Command Line Options

The following help text can be viewed by running the following command: `npx fork-version --help`

<!-- START COMMAND LINE OPTIONS -->

```text
Usage:
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
    Prints the current version and exits.
```

<!-- END COMMAND LINE OPTIONS -->

### Configuration File

You can configure Fork-Version using one of the following files:

- [A javascript file](#javascript-config):
  - fork.config.ts
  - fork.config.js
  - fork.config.cjs
  - fork.config.mjs
- [A json file](#json-config):
  - fork.config.json
  - package.json >> Key Name: "fork-version"

#### Javascript Config

Configuring using a javascript file is the most flexible option. You can use any javascript file type you prefer including typescript. Both commonjs and esm exports styles are supported. The `defineConfig` function in the following snippet is optional, using it will give you intellisense information in your code editor of choice.

```js
// fork.config.ts
import { defineConfig } from 'fork-version';

export default defineConfig({
  header: `# My Changelog`,
  files: ["package.json", "package-lock.json"],
});
```

Alternatively you can use typescript type annotations in a typescript file:

```ts
// fork.config.ts
import type { Config } from 'fork-version';

const config: Config = {
  header: `# My Changelog`,
  files: ["package.json", "package-lock.json"],
};

export default config;
```

Or jsdocs in a javascript file:

```js
// fork.config.js
/** @type {import("fork-version").Config} */
export default {
  header: `# My Changelog`,
  files: ["package.json", "package-lock.json"],
};
```

Or just raw dog it without type information. ಠ_ಠ

#### Json Config

Another way you can configure Fork-Version is by using a json file called `fork.config.json`. This is a good option if you're using Fork-Version on a non javascript project, or without installation.

If you still want intellisense information you can use the following schema in your json file, otherwise `$schema` is an optional key.

```json
// fork.config.json
{
  "$schema": "https://raw.githubusercontent.com/eglavin/fork-version/main/schema/latest.json",
  "header": "# My Changelog",
  "files": [
    "package.json",
    "package-lock.json"
  ]
}
```

Internally we're using [zod-to-json-schema](https://github.com/StefanTerdell/zod-to-json-schema) to generate the schema. Checkout the [schema folder](./schema/latest.json) to see the current state.

Alternatively you can define your config using a key in your `package.json` file called `fork-version`:

```json
// package.json
{
  "name": "my-js-project",
  "version": "1.2.3",
  "fork-version": {
    "header": "# My Changelog",
    "files": [
      "package.json",
      "package-lock.json"
    ]
  }
}
```

#### Config Properties

| Property                                              | Type             | Default                 | Description                                                                                                         |
| :---------------------------------------------------- | :--------------- | :---------------------- | :------------------------------------------------------------------------------------------------------------------ |
| command                                               | string           | `main`                  | The command to run. Can be one of: main, inspect-version, inspect-tag, validate-config. Defaults to main.           |
| [files](#configfiles)                                 | Array\<string>   | `["package.json", ...]` | List of the files to be updated                                                                                     |
| [glob](#configglob)                                   | string           | -                       | Glob pattern to match files to be updated                                                                           |
| path                                                  | string           | `process.cwd()`         | The path Fork-Version will run from                                                                                 |
| changelog                                             | string           | `CHANGELOG.md`          | Name of the changelog file                                                                                          |
| header                                                | string           | `# Changelog...`        | The header text for the changelog                                                                                   |
| [tagPrefix](#configtagprefix)                         | string           | `v`                     | Prefix for the created tag                                                                                          |
| [preRelease](#configprerelease)                       | string / boolean | -                       | Make a pre-release with optional label if given value is a string                                                   |
| currentVersion                                        | string           | -                       | Use this version instead of trying to determine one                                                                 |
| nextVersion                                           | string           | -                       | Attempt to update to this version, instead of incrementing using "conventional-commit"                              |
| [releaseAs](#configreleaseas)                         | string           | -                       | Release as increments the version by the specified level. Overrides the default behaviour of "conventional-commit". |
| allowMultipleVersions                                 | boolean          | true                    | Don't throw an error if multiple versions are found in the given files.                                             |
| commitAll                                             | boolean          | false                   | Commit all changes, not just files updated by Fork-Version                                                          |
| changelogAll                                          | boolean          | false                   | If this flag is set, all default commit types will be added to the changelog, not just `feat` and `fix`.            |
| debug                                                 | boolean          | false                   | Output debug information                                                                                            |
| dryRun                                                | boolean          | false                   | No output will be written to disk or committed                                                                      |
| silent                                                | boolean          | false                   | Run without logging to the terminal                                                                                 |
| gitTagFallback                                        | boolean          | true                    | If unable to find a version in the given files, fallback and attempt to use the latest git tag                      |
| sign                                                  | boolean          | false                   | Sign the commit with the systems GPG key                                                                            |
| verify                                                | boolean          | false                   | Run user defined git hooks before committing                                                                        |
| skipBump                                              | boolean          | false                   | Skip the bump step                                                                                                  |
| skipChangelog                                         | boolean          | false                   | Skip the changelog step                                                                                             |
| skipCommit                                            | boolean          | false                   | Skip the commit step                                                                                                |
| skipTag                                               | boolean          | false                   | Skip the tag step                                                                                                   |
| [changelogPresetConfig](#configchangelogpresetconfig) | object           | {}                      | Override defaults from the "conventional-changelog-conventionalcommits" preset configuration                        |
| releaseMessageSuffix                                  | string           | -                       | Add a suffix to the end of the release message                                                                      |

##### config.files

By default Fork-Version will attempt to read versions from and update these files, if you define your own list it will override the default list instead of merging.

- "package.json"
- "package-lock.json"
- "npm-shrinkwrap.json"
- "jsr.json"
- "jsr.jsonc"
- "deno.json"
- "deno.jsonc"
- "manifest.json"
- "bower.json"

See the [Supported File Types](#supported-file-types) section below to see the currently supported file types.

##### config.glob

An alternative to [config.files](#configfiles), a glob allows you to search for files using wildcard characters.

For example if you have the following folder structure:

```text
API/
- MyAPI.csproj
Library/
- MyLibrary.csproj
Web/
- package.json
```

Running `npx fork-version -G "{*/*.csproj,*/package.json}"` will update both csproj files and the package.json file.

Internally Fork-Version uses [isaacs glob](https://github.com/isaacs/node-glob) to match files. Read more about the pattern syntax [here](https://github.com/isaacs/node-glob/tree/v10.3.12?tab=readme-ov-file#glob-primer).

> [!WARNING]
> Ensure you wrap your glob pattern in quotes to prevent shell expansion.

##### config.tagPrefix

Allows you to control the prefix for the created tag. This is useful if your using a mono-repo in which you version multiple projects separately or simply want to use a different prefix for your tags.

| Example Value            | Tag Created                   |
|:-------------------------|:------------------------------|
| "v" (Default)            | `v1.2.3`                      |
| ""                       | `1.2.3`                       |
| "version/"               | `version/1.2.3`               |
| "@eglavin/fork-version-" | `@eglavin/fork-version-1.2.3` |

##### config.preRelease

Marking a release as a pre-release allows you to define a change as a patch to a specific version. This allows you to mark a fix for a version or an alpha build for example.

| Example Value | Version Created |
|:--------------|:----------------|
| `true`        | `1.2.3-0`       |
| `alpha`       | `1.2.3-alpha.0` |

Fork-Version uses [meow](https://github.com/sindresorhus/meow) to parse cli arguments which is unable to take a single argument and parse it as either a string and or a boolean. So to do the above through the cli interface you'll need to use two different arguments:

| Example CLI Usage                      | Version Created |
|:---------------------------------------|:----------------|
| `fork-version --pre-release`           | `1.2.3-0`       |
| `fork-version --pre-release-tag alpha` | `1.2.3-alpha.0` |

##### config.releaseAs

Allows you to override the default versioning behaviour of Fork-Version and increment by the specified level. For example if the current version is `1.2.3` and you run Fork-Version with one of the following arguments, the version will be incremented as shown below.

| Example Value | Version Created |
|:--------------|:----------------|
| `major`       | 2.0.0           |
| `minor`       | 1.3.0           |
| `patch`       | 1.2.4           |

##### config.changelogPresetConfig

Fork-Version uses the [conventional changelog config spec](https://github.com/conventional-changelog/conventional-changelog-config-spec). The following is an excerpt of the configurable options.

| Property                                   | Type           | Default                                                                      | Description                                                             |
|:-------------------------------------------|:---------------|:-----------------------------------------------------------------------------|:------------------------------------------------------------------------|
| [types](#configchangelogpresetconfigtypes) | Array\<Type>   | {}                                                                           | List of explicitly supported commit message types                       |
| commitUrlFormat                            | string         | `{{host}}/{{owner}}/{{repository}}/commit/{{hash}}`                          | A URL representing a specific commit at a hash                          |
| compareUrlFormat                           | string         | `{{host}}/{{owner}}/{{repository}}/compare/{{previousTag}}...{{currentTag}}` | A URL representing the comparison between two git SHAs                  |
| issueUrlFormat                             | string         | `{{host}}/{{owner}}/{{repository}}/issues/{{id}}`                            | A URL representing the issue format                                     |
| userUrlFormat                              | string         | `{{host}}/{{user}}`                                                          | A URL representing a user's profile                                     |
| releaseCommitMessageFormat                 | string         | `chore(release): {{currentTag}}`                                             | A string to be used to format the auto-generated release commit message |
| issuePrefixes                              | Array\<string> | `["#"]`                                                                      | List of prefixes used to detect references to issues                    |

###### config.changelogPresetConfig.types

By default only `feat` and `fix` commits are added to your changelog, you can configure extra sections to show by modifying this section.

Checkout the `fork.config.js` file [here](./fork.config.js) to see an example of modifying the types.

| Property | Type    | Description                                                              |
|:---------|:--------|:-------------------------------------------------------------------------|
| type     | string  | The type of commit message. "feat", "fix", "chore", etc..                |
| scope    | string  | The scope of the commit message.                                         |
| section  | string  | The name of the section in the `CHANGELOG` the commit should show up in. |
| hidden   | boolean | Should show in the generated changelog message?                          |

##### config.releaseMessageSuffix

Adds a suffix to the end of the release message, useful to add a `[skip ci]` message to the end of the created commit.

- [GitHub Actions - Skipping workflow runs](https://docs.github.com/en/actions/managing-workflow-runs/skipping-workflow-runs)
- [Azure Devops - Skipping CI for individual pushes](https://learn.microsoft.com/en-us/azure/devops/pipelines/repos/azure-repos-git?view=azure-devops&tabs=yaml#skipping-ci-for-individual-pushes)

### Supported File Types

- [Json Package](#json-package)
- [Yaml Package](#yaml-package)
- [Plain Text](#plain-text)
- [MS Build](#ms-build)
- [ARM Bicep](#arm-bicep)

#### Json Package

A json package is a json file which contains a version property, such as a npm package.json file.

```json
{
  "name": "my-project",
  "version": "1.2.3",
  "private": false,
}
```

#### Yaml Package

A yaml package is a yaml file which contains a version property, such as a dart pubspec.yaml file.

```yaml
name: wordionary
description: "My project"
publish_to: 'none'
version: 1.2.3
```

> [!NOTE]
> If you're using Fork-Version for a flutter project, Fork-Version will split the version and the builder number on the "+" character, the version will be updated and the builder number will be left as is.

#### Plain Text

A plain text file is a file which contains just the version as the content. Files that end with `version.txt` will be treated as a plain text version file.

```text
1.2.3
```

#### MS Build

A MS build project is an xml file with with a `Version` property under the `Project > PropertyGroup` node group.

```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <Version>1.2.3</Version>
  </PropertyGroup>
</Project>
```

Fork-Version currently supports reading and updating the following file extensions: `.csproj` `.dbproj` `.esproj` `.fsproj` `.props` `.vbproj` `.vcxproj`

#### ARM Bicep

An ARM bicep file with metadata and variable called contentVersion.

```bicep
metadata contentVersion = '1.2.3.4'
var contentVersion string = '1.2.3.4'
```

#### Custom File Updater's

`TODO` [add support for custom file readers and writers through config #5](https://github.com/eglavin/fork-version/issues/5)

### Code Usage

> [!WARNING]
> Code usage is not recommended as the public api is not stable and may change between versions.
>
> In the future the api may be stabilized and documented but this is not a focus at this time.
