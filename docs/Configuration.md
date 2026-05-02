# Configuration

[Skip to config options](#config-options)

Fork-Version can be configured either through a config file or by passing options to the tool when ran. The following config file types are supported:

- [Javascript file](#javascript-config):
  - fork.config.ts
  - fork.config.js
  - fork.config.cjs
  - fork.config.mjs
- [Json file](#json-config):
  - fork.config.json
  - package.json
    - Key Name: "fork-version"

## Javascript Config

Configuring using a javascript file is the most flexible option. You can use any javascript file type you prefer including typescript. Both commonjs and esm exports styles are supported. The `defineConfig` function in the following snippet is optional, using it will give you intellisense information in your code editor.

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

## Json Config

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

Checkout the [schema folder](../schema/latest.json) to see the current state.

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

## Config Options

### Options

| Property                                                                | Type                 | Default                 | Description                                                                                                        |
| :---------------------------------------------------------------------- | :------------------- | :---------------------- | :----------------------------------------------------------------------------------------------------------------- |
| path                                                                    | string               | `process.cwd()`         | The path Fork-Version will run from                                                                                |
| [files](#configfiles)                                                   | Array\<string>       | `["package.json", ...]` | List of the files to be updated                                                                                    |
| [customFileManagers](./Supported-File-Managers.md#custom-file-updaters) | Array\<IFileManager> | -                       | Support for user provided custom file managers                                                                     |
| [glob](#configglob)                                                     | string               | -                       | Glob pattern to match files to be updated                                                                          |
| changelog                                                               | string               | `CHANGELOG.md`          | Name of the changelog file                                                                                         |
| header                                                                  | string               | `# Changelog...`        | The header text for the changelog                                                                                  |
| [tagPrefix](#configtagprefix)                                           | string               | `v`                     | Prefix for the created tag                                                                                         |
| [preRelease](#configprerelease)                                         | string / boolean     | -                       | Make a pre-release with optional label if given value is a string                                                  |
| currentVersion                                                          | string               | -                       | Use this version instead of trying to determine one                                                                |
| nextVersion                                                             | string               | -                       | Attempt to update to this version, instead of incrementing using "conventional-commit"                             |
| [releaseAs](#configreleaseas)                                           | string               | -                       | Release as increments the version by the specified level. Overrides the default behaviour of "conventional-commit" |
| [releaseMessageSuffix](#configreleasemessagesuffix)                     | string               | -                       | Add a suffix to the end of the release message                                                                     |

#### config.files

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

See the [Supported File Managers](./Supported-File-Managers.md) documentation to see the currently supported file types and the [Custom File Updater's](./Supported-File-Managers.md#custom-file-updaters) section to see how to support any other file types.

#### config.glob

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

[Read more about glob pattern syntax](https://github.com/isaacs/node-glob/tree/v10.3.12?tab=readme-ov-file#glob-primer).

> [!WARNING]
> Ensure you wrap your glob pattern in quotes to prevent shell expansion.

#### config.tagPrefix

Allows you to control the prefix for the created tag. This is useful if your using a mono-repo in which you version multiple projects separately or simply want to use a different prefix for your tags.

| Example Value            | Tag Created                   |
| :----------------------- | :---------------------------- |
| "v" (Default)            | `v1.2.3`                      |
| ""                       | `1.2.3`                       |
| "version/"               | `version/1.2.3`               |
| "@eglavin/fork-version-" | `@eglavin/fork-version-1.2.3` |

#### config.preRelease

Marking a release as a pre-release allows you to publish versions that are not considered stable yet. This is useful for testing new features or for releasing alpha/beta versions of your project.

| Example Value | Version Created |
| :------------ | :-------------- |
| true          | `1.2.3-0`       |
| "alpha"       | `1.2.3-alpha.0` |

Fork-Version uses [meow](https://github.com/sindresorhus/meow) for CLI argument parsing. Because meow cannot parse a single option as both `string` and `boolean`, the CLI exposes this behavior through two separate arguments instead.

| Example CLI Usage                      | Version Created |
| :------------------------------------- | :-------------- |
| `fork-version --pre-release`           | `1.2.3-0`       |
| `fork-version --pre-release-tag alpha` | `1.2.3-alpha.0` |

#### config.releaseMessageSuffix

Add a suffix to the end of the release message, useful to add a `[skip ci]` message to the end of the created commit.

- [GitHub Actions - Skipping workflow runs](https://docs.github.com/en/actions/managing-workflow-runs/skipping-workflow-runs)
- [GitLab Pipelines - Skip a pipeline](https://docs.gitlab.com/ci/pipelines/#skip-a-pipeline)
- [Azure Devops - Skipping CI for individual pushes](https://learn.microsoft.com/en-us/azure/devops/pipelines/repos/azure-repos-git?view=azure-devops&tabs=yaml#skipping-ci-for-individual-pushes)

#### config.releaseAs

Allows you to override the default versioning behaviour and increment by the specified level. For example if the current version is `1.2.3` and you run Fork-Version with one of the following arguments, the version will be incremented as shown below.

| Example Value | Version Created |
| :------------ | :-------------- |
| "major"       | `2.0.0`         |
| "minor"       | `1.3.0`         |
| "patch"       | `1.2.4`         |

### Flags

| Property              | Type    | Default | Description                                                                                              |
| :-------------------- | :------ | :------ | :------------------------------------------------------------------------------------------------------- |
| allowMultipleVersions | boolean | true    | Don't throw an error if multiple versions are found in the given files.                                  |
| commitAll             | boolean | false   | Commit all changes, not just files updated by Fork-Version                                               |
| changelogAll          | boolean | false   | If this flag is set, all default commit types will be added to the changelog, not just `feat` and `fix`. |
| debug                 | boolean | false   | Output debug information (will save a json file with debug details)                                      |
| dryRun                | boolean | false   | No output will be written to disk or committed                                                           |
| silent                | boolean | false   | Run without logging to the terminal                                                                      |
| gitTagFallback        | boolean | true    | If unable to find a version in the given files, fallback and attempt to use the latest git tag           |
| sign                  | boolean | false   | Sign the commit with the systems GPG key                                                                 |
| verify                | boolean | false   | Run user defined git hooks before committing                                                             |
| asJson                | boolean | false   | Print inspected output as a parsable json string                                                         |

### Skip Steps

| Property      | Type    | Default | Description             |
| :------------ | :------ | :------ | :---------------------- |
| skipBump      | boolean | false   | Skip the bump step      |
| skipChangelog | boolean | false   | Skip the changelog step |
| skipCommit    | boolean | false   | Skip the commit step    |
| skipTag       | boolean | false   | Skip the tag step       |

### Commit Parser and Changelog Options

| Property                                              | Type   | Default | Description                                                                                  |
| :---------------------------------------------------- | :----- | :------ | :------------------------------------------------------------------------------------------- |
| [commitParserOptions](#configcommitparseroptions)     | object | {}      | Options to pass to commit parser                                                             |
| [changelogPresetConfig](#configchangelogpresetconfig) | object | {}      | Override defaults from the "conventional-changelog-conventionalcommits" preset configuration |

#### config.commitParserOptions

The commit parser options allow you to configure the regex patterns used to parse commits. This is useful if your team has a specific commit message format that doesn't match the default conventional commit format. Or if you want to control how other parts of the commit message are parsed such as mentions, references, notes, etc...

| Property               | Type           | Description                                       |
| :--------------------- | :------------- | :------------------------------------------------ |
| subjectPattern         | Regex          | Pattern to match commit subjects                  |
| mergePattern           | Regex          | Pattern to match merge commits                    |
| revertPattern          | Regex          | Pattern to match revert commits                   |
| commentPattern         | Regex          | Pattern to match commented out lines              |
| mentionPattern         | Regex          | Pattern to match mentions                         |
| referenceActions       | Array\<string> | List of action labels to match reference sections |
| referenceActionPattern | Regex          | Pattern to match reference sections               |
| issuePrefixes          | Array\<string> | List of issue prefixes to match issue ids         |
| issuePattern           | Regex          | Pattern to match issue references                 |
| noteKeywords           | Array\<string> | List of keywords to match note titles             |
| notePattern            | Regex          | Pattern to match note sections                    |

[View the commit parser options to see the default patterns used.](../src/commit-parser/options.ts)

If you are using one of the following Git hosts, Fork-Version will automatically use the correct commit parser options for that host:

- GitHub
- GitLab
- BitBucket
- Azure DevOps

[View the `detect-git-host` function to see how Fork-Version detects the git host.](../src/detect-git-host/detect-git-host.ts)

#### config.changelogPresetConfig

Fork-Version uses the [conventional changelog config spec](https://github.com/conventional-changelog/conventional-changelog-config-spec). The following is an excerpt of the configurable options.

| Property                                   | Type           | Default                                                                      | Description                                                             |
| :----------------------------------------- | :------------- | :--------------------------------------------------------------------------- | :---------------------------------------------------------------------- |
| [types](#configchangelogpresetconfigtypes) | Array\<Type>   | {}                                                                           | List of explicitly supported commit message types                       |
| commitUrlFormat                            | string         | `{{host}}/{{owner}}/{{repository}}/commit/{{hash}}`                          | A URL representing a specific commit at a hash                          |
| compareUrlFormat                           | string         | `{{host}}/{{owner}}/{{repository}}/compare/{{previousTag}}...{{currentTag}}` | A URL representing the comparison between two git SHAs                  |
| issueUrlFormat                             | string         | `{{host}}/{{owner}}/{{repository}}/issues/{{id}}`                            | A URL representing the issue format                                     |
| userUrlFormat                              | string         | `{{host}}/{{user}}`                                                          | A URL representing a user's profile                                     |
| releaseCommitMessageFormat                 | string         | `chore(release): {{currentTag}}`                                             | A string to be used to format the auto-generated release commit message |
| issuePrefixes                              | Array\<string> | `["#"]`                                                                      | List of prefixes used to detect references to issues                    |

##### config.changelogPresetConfig.types

By default only `feat` and `fix` commits are added to your changelog, you can configure extra sections to show by modifying this section.

| Property | Type    | Description                                                              |
| :------- | :------ | :----------------------------------------------------------------------- |
| type     | string  | The type of commit message. "feat", "fix", "chore", etc..                |
| scope    | string  | The scope of the commit message.                                         |
| section  | string  | The name of the section in the `CHANGELOG` the commit should show up in. |
| hidden   | boolean | Should show in the generated changelog message?                          |

[View the `fork.config.js` file to see an example of modifying the accepted types.](../fork.config.js)
