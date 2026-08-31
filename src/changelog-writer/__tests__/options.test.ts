import { createWriterOptions } from "../options";

describe("changelog-writer options", () => {
	it("should return the default config", () => {
		const config = createWriterOptions({}, {} as never, undefined);

		expect(config).toStrictEqual({
			commitUrlFormat: "{{host}}/{{owner}}/{{repository}}/commit/{{hash}}",
			compareUrlFormat:
				"{{host}}/{{owner}}/{{repository}}/compare/{{previousTag}}...{{currentTag}}",
			issueUrlFormat: "{{host}}/{{owner}}/{{repository}}/issues/{{id}}",
			userUrlFormat: "{{host}}/{{user}}",
		});
	});

	it("user should be able to override default settings", () => {
		const config = createWriterOptions(
			{
				changelogWriterOptions: {
					commitUrlFormat: "{{host}}/fork-version/commit/{{hash}}",
					compareUrlFormat:
						"{{host}}/fork-version/branchCompare?baseVersion=GT{{previousTag}}&targetVersion=GT{{currentTag}}",
				},
			},
			{} as never,
			undefined,
		);

		expect(config).toStrictEqual({
			commitUrlFormat: "{{host}}/fork-version/commit/{{hash}}",
			compareUrlFormat:
				"{{host}}/fork-version/branchCompare?baseVersion=GT{{previousTag}}&targetVersion=GT{{currentTag}}",
			issueUrlFormat: "{{host}}/{{owner}}/{{repository}}/issues/{{id}}",
			userUrlFormat: "{{host}}/{{user}}",
		});
	});

	it("should be able to override from CLI arguments", () => {
		const config = createWriterOptions(
			{},
			{
				commitUrlFormat: "{{host}}/fork-version/commit/{{hash}}",
				compareUrlFormat:
					"{{host}}/fork-version/branchCompare?baseVersion=GT{{previousTag}}&targetVersion=GT{{currentTag}}",
				issueUrlFormat: "{{host}}/fork-version/issues/{{id}}",
				userUrlFormat: "{{host}}/fork-version/user/{{user}}",
			} as never,
			undefined,
		);

		expect(config.commitUrlFormat).toBe("{{host}}/fork-version/commit/{{hash}}");
		expect(config.compareUrlFormat).toBe(
			"{{host}}/fork-version/branchCompare?baseVersion=GT{{previousTag}}&targetVersion=GT{{currentTag}}",
		);
		expect(config.issueUrlFormat).toBe("{{host}}/fork-version/issues/{{id}}");
		expect(config.userUrlFormat).toBe("{{host}}/fork-version/user/{{user}}");
	});

	it("should be able to detect the git host", () => {
		const config = createWriterOptions({}, {} as never, {
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
		const config = createWriterOptions(
			{
				changelogWriterOptions: {
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
});
