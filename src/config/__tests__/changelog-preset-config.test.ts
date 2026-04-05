import { getChangelogPresetConfig } from "../changelog-preset-config";

describe("changelog-preset-config", () => {
	it("should return the default config", () => {
		const config = getChangelogPresetConfig({}, {} as never, undefined);

		expect(config).toStrictEqual({
			commitUrlFormat: "{{host}}/{{owner}}/{{repository}}/commit/{{hash}}",
			compareUrlFormat:
				"{{host}}/{{owner}}/{{repository}}/compare/{{previousTag}}...{{currentTag}}",
			header: `# Changelog

`,
			issuePrefixes: ["#"],
			issueUrlFormat: "{{host}}/{{owner}}/{{repository}}/issues/{{id}}",
			name: "conventionalcommits",
			preMajor: false,
			releaseCommitMessageFormat: "chore(release): {{currentTag}}",
			types: [
				{
					section: "Features",
					type: "feat",
				},
				{
					section: "Bug Fixes",
					type: "fix",
				},
				{
					hidden: true,
					type: "chore",
				},
				{
					hidden: true,
					type: "docs",
				},
				{
					hidden: true,
					type: "style",
				},
				{
					hidden: true,
					type: "refactor",
				},
				{
					hidden: true,
					type: "perf",
				},
				{
					hidden: true,
					type: "test",
				},
			],
			userUrlFormat: "{{host}}/{{user}}",
		});
	});

	it("user should be able to override default settings", () => {
		const config = getChangelogPresetConfig(
			{
				changelogPresetConfig: {
					commitUrlFormat: "{{host}}/fork-version/commit/{{hash}}",
					compareUrlFormat:
						"{{host}}/fork-version/branchCompare?baseVersion=GT{{previousTag}}&targetVersion=GT{{currentTag}}",
					releaseCommitMessageFormat: "chore(release): {{currentTag}} [skip ci]",
					types: [
						{ type: "feat", section: "New Features" },
						{ type: "fix", section: "Bug Fixes" },
					],
				},
			},
			{} as never,
			undefined,
		);

		expect(config).toStrictEqual({
			commitUrlFormat: "{{host}}/fork-version/commit/{{hash}}",
			compareUrlFormat:
				"{{host}}/fork-version/branchCompare?baseVersion=GT{{previousTag}}&targetVersion=GT{{currentTag}}",
			header: `# Changelog

`,
			issuePrefixes: ["#"],
			issueUrlFormat: "{{host}}/{{owner}}/{{repository}}/issues/{{id}}",
			name: "conventionalcommits",
			preMajor: false,
			releaseCommitMessageFormat: "chore(release): {{currentTag}} [skip ci]",
			types: [
				{
					section: "New Features",
					type: "feat",
				},
				{
					section: "Bug Fixes",
					type: "fix",
				},
			],
			userUrlFormat: "{{host}}/{{user}}",
		});
	});

	it("should be able to override from CLI arguments", () => {
		const config = getChangelogPresetConfig(
			{},
			{
				commitUrlFormat: "{{host}}/fork-version/commit/{{hash}}",
				compareUrlFormat:
					"{{host}}/fork-version/branchCompare?baseVersion=GT{{previousTag}}&targetVersion=GT{{currentTag}}",
				issueUrlFormat: "{{host}}/fork-version/issues/{{id}}",
				userUrlFormat: "{{host}}/fork-version/user/{{user}}",
				releaseCommitMessageFormat: "chore(release): {{currentTag}} [skip ci]",
			} as never,
			undefined,
		);

		expect(config.commitUrlFormat).toBe("{{host}}/fork-version/commit/{{hash}}");
		expect(config.compareUrlFormat).toBe(
			"{{host}}/fork-version/branchCompare?baseVersion=GT{{previousTag}}&targetVersion=GT{{currentTag}}",
		);
		expect(config.issueUrlFormat).toBe("{{host}}/fork-version/issues/{{id}}");
		expect(config.userUrlFormat).toBe("{{host}}/fork-version/user/{{user}}");
		expect(config.releaseCommitMessageFormat).toBe("chore(release): {{currentTag}} [skip ci]");
	});

	it("should be able to append a releaseMessageSuffix to the releaseCommitMessageFormat", () => {
		const config = getChangelogPresetConfig(
			{
				releaseMessageSuffix: "[skip ci]",
			},
			{} as never,
			undefined,
		);

		expect(config.releaseCommitMessageFormat).toBe("chore(release): {{currentTag}} [skip ci]");
	});

	it("should be able to append a releaseMessageSuffix to the releaseCommitMessageFormat from CLI arguments", () => {
		const config = getChangelogPresetConfig(
			{},
			{
				releaseMessageSuffix: "[no ci]",
			} as never,
			undefined,
		);

		expect(config.releaseCommitMessageFormat).toBe("chore(release): {{currentTag}} [no ci]");
	});

	it("should be able to detect the git host", () => {
		const config = getChangelogPresetConfig({}, {} as never, {
			commitUrlFormat:
				"{{host}}/ORGANISATION/PROJECT/_git/REPOSITORY/branchCompare?baseVersion=GT{{previousTag}}&targetVersion=GT{{currentTag}}",
			compareUrlFormat: "{{host}}/ORGANISATION/PROJECT/_git/REPOSITORY/commit/{{hash}}",
			issueUrlFormat: "{{host}}/ORGANISATION/PROJECT/_workitems/edit/{{id}}",
		});

		expect(config.commitUrlFormat).toBe(
			"{{host}}/ORGANISATION/PROJECT/_git/REPOSITORY/branchCompare?baseVersion=GT{{previousTag}}&targetVersion=GT{{currentTag}}",
		);
		expect(config.compareUrlFormat).toBe(
			"{{host}}/ORGANISATION/PROJECT/_git/REPOSITORY/commit/{{hash}}",
		);
		expect(config.issueUrlFormat).toBe("{{host}}/ORGANISATION/PROJECT/_workitems/edit/{{id}}");
	});

	it("should still be able to override the detected git host from configs", () => {
		const config = getChangelogPresetConfig(
			{
				changelogPresetConfig: {
					commitUrlFormat: "{{host}}/fork-version/commit/{{hash}}",
				},
			},
			{
				compareUrlFormat:
					"{{host}}/fork-version/branchCompare?baseVersion=GT{{previousTag}}&targetVersion=GT{{currentTag}}",
			} as never,
			{
				commitUrlFormat:
					"{{host}}/ORGANISATION/PROJECT/_git/REPOSITORY/branchCompare?baseVersion=GT{{previousTag}}&targetVersion=GT{{currentTag}}",
				compareUrlFormat: "{{host}}/ORGANISATION/PROJECT/_git/REPOSITORY/commit/{{hash}}",
				issueUrlFormat: "{{host}}/ORGANISATION/PROJECT/_workitems/edit/{{id}}",
			},
		);

		expect(config.commitUrlFormat).toBe("{{host}}/fork-version/commit/{{hash}}");
		expect(config.compareUrlFormat).toBe(
			"{{host}}/fork-version/branchCompare?baseVersion=GT{{previousTag}}&targetVersion=GT{{currentTag}}",
		);
		expect(config.issueUrlFormat).toBe("{{host}}/ORGANISATION/PROJECT/_workitems/edit/{{id}}");
	});

	it("should not change log all if not set", () => {
		const config = getChangelogPresetConfig({}, {} as never, undefined);

		expect(config.types).toStrictEqual([
			{
				type: "feat",
				section: "Features",
			},
			{
				type: "fix",
				section: "Bug Fixes",
			},
			{
				type: "chore",
				hidden: true,
			},
			{
				type: "docs",
				hidden: true,
			},
			{
				type: "style",
				hidden: true,
			},
			{
				type: "refactor",
				hidden: true,
			},
			{
				type: "perf",
				hidden: true,
			},
			{
				type: "test",
				hidden: true,
			},
		]);
	});

	it("should be able to changelog all default types", () => {
		const config = getChangelogPresetConfig(
			{
				changelogAll: true,
			},
			{} as never,
			undefined,
		);

		expect(config.types).toStrictEqual([
			{
				type: "feat",
				section: "Features",
			},
			{
				type: "fix",
				section: "Bug Fixes",
			},
			{
				type: "chore",
				section: "Other Changes",
			},
			{
				type: "docs",
				section: "Other Changes",
			},
			{
				type: "style",
				section: "Other Changes",
			},
			{
				type: "refactor",
				section: "Other Changes",
			},
			{
				type: "perf",
				section: "Other Changes",
			},
			{
				type: "test",
				section: "Other Changes",
			},
		]);
	});
});
