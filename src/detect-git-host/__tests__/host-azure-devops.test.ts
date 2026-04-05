import { detectAzureDevopsOptions } from "../host-azure-devops";

describe("host-azure-devops", () => {
	it("should detect a https azure git host", () => {
		const gitHost = detectAzureDevopsOptions(
			"https://ORGANISATION@dev.azure.com/ORGANISATION/PROJECT/_git/REPOSITORY",
		);

		expect(gitHost?.hostName).toBe("Azure Devops");
		expect(gitHost?.changelogOptions?.commitUrlFormat).toBe(
			"https://dev.azure.com/ORGANISATION/PROJECT/_git/REPOSITORY/commit/{{hash}}",
		);
		expect(gitHost?.changelogOptions?.compareUrlFormat).toBe(
			"https://dev.azure.com/ORGANISATION/PROJECT/_git/REPOSITORY/branchCompare?baseVersion=GT{{previousTag}}&targetVersion=GT{{currentTag}}",
		);
		expect(gitHost?.changelogOptions?.issueUrlFormat).toBe(
			"https://dev.azure.com/ORGANISATION/PROJECT/_workitems/edit/{{id}}",
		);

		expect(gitHost?.commitParserOptions?.mergePattern).toBeDefined();
		const parsed = gitHost?.commitParserOptions?.mergePattern?.exec("Merged PR 123: some-branch");
		expect(parsed?.groups?.id).toBe("123");
		expect(parsed?.groups?.source).toBe("some-branch");
	});

	it("should detect a ssh azure git host", () => {
		const gitHost = detectAzureDevopsOptions(
			"git@ssh.dev.azure.com:v3/ORGANISATION/PROJECT/REPOSITORY",
		);

		expect(gitHost?.hostName).toBe("Azure Devops");
		expect(gitHost?.changelogOptions?.commitUrlFormat).toBe(
			"https://dev.azure.com/ORGANISATION/PROJECT/_git/REPOSITORY/commit/{{hash}}",
		);
		expect(gitHost?.changelogOptions?.compareUrlFormat).toBe(
			"https://dev.azure.com/ORGANISATION/PROJECT/_git/REPOSITORY/branchCompare?baseVersion=GT{{previousTag}}&targetVersion=GT{{currentTag}}",
		);
		expect(gitHost?.changelogOptions?.issueUrlFormat).toBe(
			"https://dev.azure.com/ORGANISATION/PROJECT/_workitems/edit/{{id}}",
		);

		expect(gitHost?.commitParserOptions?.mergePattern).toBeDefined();
		const parsed = gitHost?.commitParserOptions?.mergePattern?.exec("Merged PR 123: some-branch");
		expect(parsed?.groups?.id).toBe("123");
		expect(parsed?.groups?.source).toBe("some-branch");
	});

	it("should return undefined if not an azure devops url", () => {
		const gitHost = detectAzureDevopsOptions("");

		expect(gitHost).toBeUndefined();
	});
});
