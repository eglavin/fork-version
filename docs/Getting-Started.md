# Getting Started

This guide walks you through setting up an automated versioning workflow with Fork-Version from scratch. It's aimed at anyone who hasn't set up a versioning pipeline before, so it explains the "why" as well as the "how".

By the end you will have:

1. A project that has a version number Fork-Version can read and update.
1. A commit message convention that tells Fork-Version how to bump that version.
1. A command you can run locally to create a release.
1. (Optionally) a CI job that creates releases for you automatically.

___Table of content:___

- [Key Concepts](#key-concepts)
  - [Semantic Versioning](#semantic-versioning)
  - [Conventional Commits](#conventional-commits)
  - [Git Tags](#git-tags)
- [Prerequisites](#prerequisites)
- [Step 1: Give Your Project a Version](#step-1-give-your-project-a-version)
- [Step 2: Write Conventional Commits](#step-2-write-conventional-commits)
- [Step 3: Try a Dry Run](#step-3-try-a-dry-run)
- [Step 4: Create Your First Release](#step-4-create-your-first-release)
- [Step 5: Push the Release](#step-5-push-the-release)
- [Step 6: Add a Config File (Optional)](#step-6-add-a-config-file-optional)
- [Step 7: Automate It in CI (Optional)](#step-7-automate-it-in-ci-optional)
- [Common Problems](#common-problems)
  - ["Unable to find current version"](#unable-to-find-current-version)
  - [The version or changelog is wrong in CI but correct locally](#the-version-or-changelog-is-wrong-in-ci-but-correct-locally)
  - [My commits aren't showing in the changelog](#my-commits-arent-showing-in-the-changelog)
  - [I need a specific version](#i-need-a-specific-version)
  - [I want to see the current version](#i-want-to-see-the-current-version)
- [Next Steps](#next-steps)

## Key Concepts

### Semantic Versioning

Fork-Version uses [semantic versioning](https://semver.org) (semver). A version looks like `MAJOR.MINOR.PATCH`, for example `1.4.2`:

| Part  | Bump when you...                                  | Example           |
| :---- | :------------------------------------------------ | :---------------- |
| MAJOR | Make a breaking change that users must adapt to   | `1.4.2` → `2.0.0` |
| MINOR | Add a new feature in a backwards compatible way   | `1.4.2` → `1.5.0` |
| PATCH | Fix a bug or make another backwards compatible change | `1.4.2` → `1.4.3` |

### Conventional Commits

Rather than deciding the next version by hand, Fork-Version reads the commit messages since your last release. If those messages follow the [conventional commit](https://www.conventionalcommits.org) standard, Fork-Version can work out what kind of release is needed and write a changelog for you.

### Git Tags

Each release is marked with a git tag (`v1.4.2` by default). Fork-Version uses the most recent tag to find out which commits are new since the last release, so tags are an important part of the workflow, don't delete them!

## Prerequisites

- [git](https://git-scm.com), with a repository for your project.
- [Node.js](https://nodejs.org) (v22.4.0 or newer), or a compatible runtime such as bun or deno.

You don't need to be working on a JavaScript project. Fork-Version can be ran with `npx` against any repository, and supports [many file types](./Supported-File-Managers.md) such as `.csproj`, `pubspec.yaml`, and plain text version files.

## Step 1: Give Your Project a Version

Fork-Version needs to know your project's current version. It reads it from the files you tell it to update.

If you have a `package.json` file, Fork-Version will use its `version` field by default:

```json
{
  "name": "my-project",
  "version": "0.1.0"
}
```

If your project doesn't have a natural place for a version, the simplest option is a `version.txt` file containing just the version:

```text
0.1.0
```

Commit this file before continuing.

> [!TIP]
> Not sure what to start with? Use `0.1.0` while your project is in early development, and `1.0.0` once it's ready for others to rely on. While the version is below `1.0.0`, Fork-Version treats changes more conservatively: breaking changes bump the MINOR version and features bump the PATCH version.

## Step 2: Write Conventional Commits

From now on, write your commit messages in the format `type: description`. The type is what drives the version bump:

| Commit message                                        | Changelog section | Bump (from `1.x.x`) |
| :---------------------------------------------------- | :---------------- | :------------------ |
| `fix: handle empty search results`                    | Bug Fixes         | PATCH               |
| `feat: add dark mode`                                 | Features          | MINOR               |
| `feat!: remove the legacy api`                        | Features          | MAJOR               |
| `chore: update dependencies`                          | (hidden)          | PATCH               |
| `docs: fix typo in readme`                            | (hidden)          | PATCH               |

The highest bump wins, so a release containing one `feat` and three `fix` commits will be a MINOR release.

There are two ways to mark a breaking change, either add a `!` after the type, or add a `BREAKING CHANGE:` footer to the commit body:

```text
feat: switch to the new config format

BREAKING CHANGE: the `settings.ini` file is no longer read, use `config.json` instead.
```

You can also add an optional scope in brackets to say which part of the project changed, for example `fix(api): return 404 for missing users`.

> [!NOTE]
> By default only `feat` and `fix` commits appear in the changelog. See [config.types](./Configuration.md#configtypes) to show other types such as `refactor` or `docs`.

## Step 3: Try a Dry Run

Before changing anything, run Fork-Version with `--dry-run` to see what it would do. Nothing is written to disk, committed, or tagged.

```sh
npx fork-version --dry-run
```

If you're using a `version.txt` file, tell Fork-Version about it with `--file`:

```sh
npx fork-version --file version.txt --dry-run
```

You should see something like this:

```text
[Dry Run] No changes will be written to disk.

No previous tag found, using all commits
Current version: 0.1.0
Next version: 0.1.1 (patch)
  - Commits: 3, Patches: 3
Updating files:
  - /my-project/version.txt
Updating changelog: /my-project/CHANGELOG.md
Committing changes
Creating tag: v0.1.1
```

The "No previous tag found" warning is expected on your first run, as there are no releases yet.

## Step 4: Create Your First Release

When you're happy with the dry run output, run it for real:

```sh
npx fork-version --file version.txt
```

Fork-Version will:

1. Update the version in `version.txt`.
1. Create (or update) `CHANGELOG.md` with the new commits.
1. Commit both files with the message `chore(release): 0.1.1`.
1. Tag that commit as `v0.1.1`.

> [!TIP]
> If you'd like your first release to use the version that's already in your files, rather than bumping it, add `--skip-bump`. For example, with `1.0.0` in `version.txt`, `npx fork-version --file version.txt --skip-bump` creates the changelog and tags `v1.0.0`.

If something doesn't look right you can undo the release locally before pushing:

```sh
git tag -d v0.1.1
git reset --hard HEAD~1
```

> [!WARNING]
> `git reset --hard` discards any uncommitted changes in your working tree, so make sure you've committed or stashed anything you want to keep first.

## Step 5: Push the Release

Fork-Version never pushes for you, so you stay in control of when a release is published. Push the release commit and its tag together:

```sh
git push --follow-tags origin main
```

Replace `main` with the name of your branch if it's different. From here you can publish your package, deploy your app, or create a release on your git host from the new tag.

That's it, you have a working versioning workflow! Each time you want to release, run Fork-Version and push.

## Step 6: Add a Config File (Optional)

Typing the same options every time gets repetitive. Instead you can save them in a `fork.config.json` file at the root of your repository:

```json
{
  "$schema": "https://raw.githubusercontent.com/eglavin/fork-version/main/schema/latest.json",
  "files": ["version.txt"]
}
```

Now `npx fork-version` will pick up your settings automatically. Use `npx fork-version validate-config` to check the file is valid.

To make sure everyone on your team (and your CI) uses the same version of Fork-Version, pin the major version:

```sh
npx fork-version@6
```

See the [Configuration documentation](./Configuration.md) for every available option, including JavaScript and TypeScript config files.

## Step 7: Automate It in CI (Optional)

Once you're comfortable running releases by hand, you can have your CI pipeline create one on every push to your main branch. The job needs to:

1. __Check out the full history and tags.__ Many CI systems do a "shallow" checkout by default which only fetches the latest commit. Without the previous tags Fork-Version can't tell what has changed, and will produce the wrong version. See [Running In CI](../README.md#running-in-ci) for the setting on each platform.
1. __Configure a git user__, so the release commit has an author.
1. __Run Fork-Version.__
1. __Push the commit and tag__ back to the repository. The CI job needs permission to push to your branch.

Here's a minimal GitHub Actions example:

```yaml
# .github/workflows/version.yml
name: Version

on:
  push:
    branches: [main]

permissions:
  contents: write

jobs:
  version:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
        with:
          fetch-depth: 0

      - uses: actions/setup-node@v6
        with:
          node-version: 22

      - name: Configure Git User
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"

      - name: Bump Version
        run: npx fork-version@6 --release-message-suffix "[skip ci]"

      - name: Push Changes
        run: git push --follow-tags origin main
```

> [!IMPORTANT]
> Because this job pushes a commit to `main`, it would normally trigger itself again. The `[skip ci]` suffix on the release commit message stops that loop. Alternatively, use a `paths` filter so the workflow only runs when source files change, see [config.releaseMessageSuffix](./Configuration.md#configreleasemessagesuffix) for how to skip CI on other platforms.

> [!NOTE]
> If your `main` branch is protected, the default `GITHUB_TOKEN` may not be allowed to push to it. In that case use a token from a GitHub App or a user that's allowed to bypass the protection rules. Fork-Version's own [version workflow](../.github/workflows/version.yml) is an example of using a GitHub App token.

## Common Problems

### "Unable to find current version"

Fork-Version couldn't find a version in any of the files it checked, and there were no previous tags to fall back on. Make sure the file containing your version is committed, not git ignored, and passed in with `--file` (or listed in your config's `files`). See [Step 1](#step-1-give-your-project-a-version).

### The version or changelog is wrong in CI but correct locally

This is almost always a shallow checkout. Look for the warning "No previous tag found in a shallow clone" in the output, and enable a full history checkout as described in [Running In CI](../README.md#running-in-ci).

### My commits aren't showing in the changelog

Only `feat` and `fix` commits are shown by default, and commits that don't follow the `type: description` format are ignored. Check your commit messages with `git log --oneline`, and see [config.types](./Configuration.md#configtypes) to add more sections.

### I need a specific version

Use `--release-as major|minor|patch` to force a type of bump, or `--next-version 2.0.0` to set the exact version.

### I want to see the current version

```sh
npx fork-version inspect
```

This prints the current version and latest tag without changing anything.

## Next Steps

- [Configuration](./Configuration.md): every option, and how to use JavaScript or TypeScript config files.
- [Supported File Managers](./Supported-File-Managers.md): the file types Fork-Version can update, and how to add your own.
- [Pre-releases](./Configuration.md#configprerelease): publish `alpha`, `beta`, or `rc` versions.
- [Monorepos](./Configuration.md#configcommitpath): version multiple packages in one repository with `commitPath` and `tagPrefix`.
