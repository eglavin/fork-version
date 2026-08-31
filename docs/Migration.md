# Migration Guides

## Migrating to 6.0.0

The `6.0.0` release replaces the `conventional-changelog` based changelog generator with a built-in one, and reorganizes a few config options as part of that change. If you don't customize changelog generation (no `changelogPresetConfig` in your config), you likely don't need to change anything, read on if you do.

### `changelogPresetConfig` has been renamed and split up

`changelogPresetConfig` no longer exists. It has been split into two separate options:

- A new top-level **`types`** option
  - The list of commit types shown in the changelog.
- **`changelogWriterOptions`**
  - The commit/compare/issue/user URL formats. This replaces
  `changelogPresetConfig`, now containing only the URL formats.

`releaseCommitMessageFormat` and `issuePrefixes` have also moved out, onto the top-level config and `commitParserOptions` respectively (see below).

```js
// Before
export default defineConfig({
  changelogPresetConfig: {
    types: [
      { type: "feat", section: "Features" },
      { type: "fix", section: "Bug Fixes" },
    ],
    commitUrlFormat: "{{host}}/{{owner}}/{{repository}}/commit/{{hash}}",
    compareUrlFormat: "{{host}}/{{owner}}/{{repository}}/compare/{{previousTag}}...{{currentTag}}",
    issueUrlFormat: "{{host}}/{{owner}}/{{repository}}/issues/{{id}}",
    userUrlFormat: "{{host}}/{{user}}",
    releaseCommitMessageFormat: "chore(release): {{currentTag}}",
    issuePrefixes: ["#"],
  },
});
```

```js
// After
export default defineConfig({
  types: [
    { type: "feat", section: "Features" },
    { type: "fix", section: "Bug Fixes" },
  ],
  changelogWriterOptions: {
    commitUrlFormat: "{{host}}/{{owner}}/{{repository}}/commit/{{hash}}",
    compareUrlFormat: "{{host}}/{{owner}}/{{repository}}/compare/{{previousTag}}...{{currentTag}}",
    issueUrlFormat: "{{host}}/{{owner}}/{{repository}}/issues/{{id}}",
    userUrlFormat: "{{host}}/{{user}}",
  },
  releaseMessageFormat: "chore(release): {{currentTag}}",
  commitParserOptions: {
    issuePrefixes: ["#"],
  },
});
```

See [config.types](./Configuration.md#configtypes) and [config.changelogWriterOptions](./Configuration.md#configchangelogwriteroptions) for the full option reference.

### `releaseCommitMessageFormat` → `releaseMessageFormat`

Renamed and moved to the top level of your config, alongside `releaseMessageSuffix`.

| Before                                             | After                                                                   |
| :------------------------------------------------- | :---------------------------------------------------------------------- |
| `changelogPresetConfig.releaseCommitMessageFormat` | [`releaseMessageFormat`](./Configuration.md#configreleasemessageformat) |
| CLI flag: `--release-commit-message-format`        | CLI flag: `--release-message-format`                                    |

### `issuePrefixes` moved to `commitParserOptions`

`changelogPresetConfig.issuePrefixes` no longer exists. Set [`commitParserOptions.issuePrefixes`](./Configuration.md#configcommitparseroptions) instead, the same list is now used both for parsing commits and for linkifying inline issue references (e.g. `#123`) in the generated changelog, so there's only one place to configure it.

```js
// Before
export default defineConfig({
  changelogPresetConfig: {
    issuePrefixes: ["#", "gh-"],
  },
});
```

```js
// After
export default defineConfig({
  commitParserOptions: {
    issuePrefixes: ["#", "gh-"],
  },
});
```

### `changelogAll` now affects custom `types` too

Previously, `changelogAll` (reveal hidden commit types under an "Other Changes" section) only ever affected the built-in default `types` list, if you supplied your own `types` array, `changelogAll` had no effect on it.

Now that `types` is resolved the same way as every other config option, `changelogAll` applies uniformly: any `hidden: true` entry in *your* `types` list will also be revealed under "Other Changes" when `changelogAll` is set.

> [!NOTE] If you rely on `changelogAll` having no effect on a custom `types` list, remove the `hidden: true` flags from it instead, or avoid setting `changelogAll`.

### Changelog output

The generated Markdown should be equivalent to before, but since it's now produced by a different implementation rather than `conventional-changelog-conventionalcommits`, it's worth diffing your `CHANGELOG.md` output after upgrading in case of small formatting differences.
