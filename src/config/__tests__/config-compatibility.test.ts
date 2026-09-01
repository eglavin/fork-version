import { applyLegacyChangelogPresetConfig, applyLegacyCliFlags } from "../config-compatibility";

describe("applyLegacyChangelogPresetConfig", () => {
	it("should pass through a config with no changelogPresetConfig", () => {
		const { config, warnings } = applyLegacyChangelogPresetConfig({ commitAll: true });

		expect(config).toStrictEqual({ commitAll: true });
		expect(warnings).toStrictEqual([]);
	});

	it("should handle an undefined config", () => {
		const { config, warnings } = applyLegacyChangelogPresetConfig(undefined);

		expect(config).toStrictEqual({});
		expect(warnings).toStrictEqual([]);
	});

	it("should map every changelogPresetConfig sub-field onto its new location", () => {
		const { config, warnings } = applyLegacyChangelogPresetConfig({
			changelogPresetConfig: {
				types: [{ type: "feat", section: "Features" }],
				commitUrlFormat: "commit-url",
				compareUrlFormat: "compare-url",
				issueUrlFormat: "issue-url",
				userUrlFormat: "user-url",
				releaseCommitMessageFormat: "chore(release): {{currentTag}}",
				issuePrefixes: ["#", "gh-"],
			},
		});

		expect(config).toStrictEqual({
			types: [{ type: "feat", section: "Features" }],
			releaseMessageFormat: "chore(release): {{currentTag}}",
			changelogWriterOptions: {
				commitUrlFormat: "commit-url",
				compareUrlFormat: "compare-url",
				issueUrlFormat: "issue-url",
				userUrlFormat: "user-url",
			},
			commitParserOptions: {
				issuePrefixes: ["#", "gh-"],
			},
		});
		expect(warnings).toHaveLength(7);
		expect(warnings.every((warning) => warning.includes("is deprecated"))).toBe(true);
	});

	it("should map only the sub-fields present on a partial changelogPresetConfig", () => {
		const { config, warnings } = applyLegacyChangelogPresetConfig({
			changelogPresetConfig: { types: [{ type: "feat" }] },
		});

		expect(config).toStrictEqual({ types: [{ type: "feat" }] });
		expect(warnings).toHaveLength(1);
		expect(warnings[0]).toContain("'changelogPresetConfig.types'");
	});

	it("should let a new-style value win over the old value, with a warning explaining why it was ignored", () => {
		const { config, warnings } = applyLegacyChangelogPresetConfig({
			types: [{ type: "fix", section: "Bug Fixes" }],
			changelogPresetConfig: { types: [{ type: "feat", section: "Old Features" }] },
		});

		expect(config).toStrictEqual({ types: [{ type: "fix", section: "Bug Fixes" }] });
		expect(warnings).toHaveLength(1);
		expect(warnings[0]).toContain("was ignored because 'types' is already set");
	});

	it("should not clobber sibling keys already set at the new location", () => {
		const { config } = applyLegacyChangelogPresetConfig({
			changelogWriterOptions: { userUrlFormat: "existing-user-url" },
			changelogPresetConfig: { commitUrlFormat: "commit-url" },
		});

		expect(config.changelogWriterOptions).toStrictEqual({
			userUrlFormat: "existing-user-url",
			commitUrlFormat: "commit-url",
		});
	});

	it("should always remove changelogPresetConfig from the returned config", () => {
		const { config } = applyLegacyChangelogPresetConfig({ changelogPresetConfig: {} });

		expect(config).not.toHaveProperty("changelogPresetConfig");
	});
});

describe("applyLegacyCliFlags", () => {
	it("should pass through flags with no legacy flag set", () => {
		const { flags, warnings } = applyLegacyCliFlags({ releaseMessageFormat: "new-format" });

		expect(flags).toStrictEqual({ releaseMessageFormat: "new-format" });
		expect(warnings).toStrictEqual([]);
	});

	it("should map the legacy flag onto releaseMessageFormat", () => {
		const { flags, warnings } = applyLegacyCliFlags({ releaseCommitMessageFormat: "old-format" });

		expect(flags).toStrictEqual({ releaseMessageFormat: "old-format" });
		expect(warnings).toHaveLength(1);
		expect(warnings[0]).toContain("'--release-commit-message-format'");
	});

	it("should let the new flag win when both are set", () => {
		const { flags, warnings } = applyLegacyCliFlags({
			releaseCommitMessageFormat: "old-format",
			releaseMessageFormat: "new-format",
		});

		expect(flags).toStrictEqual({ releaseMessageFormat: "new-format" });
		expect(warnings).toHaveLength(1);
		expect(warnings[0]).toContain("was ignored because '--release-message-format' is already set");
	});
});
