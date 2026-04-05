import { detectGitHubOptions } from "../host-github";

describe("host-github", () => {
	it("should detect a https github git host", () => {
		const gitHost = detectGitHubOptions("https://github.com/ORGANISATION/REPOSITORY.git");

		expect(gitHost?.hostName).toBe("GitHub");
		expect(gitHost?.changelogOptions?.commitUrlFormat).toBe(
			"https://github.com/ORGANISATION/REPOSITORY/commit/{{hash}}",
		);
		expect(gitHost?.changelogOptions?.compareUrlFormat).toBe(
			"https://github.com/ORGANISATION/REPOSITORY/compare/{{previousTag}}...{{currentTag}}",
		);
		expect(gitHost?.changelogOptions?.issueUrlFormat).toBe(
			"https://github.com/ORGANISATION/REPOSITORY/issues/{{id}}",
		);

		expect(gitHost?.commitParserOptions?.mergePattern).toBeDefined();
		const parsed = gitHost?.commitParserOptions?.mergePattern?.exec(
			"Merge pull request #123 from some-branch",
		);
		expect(parsed?.groups?.id).toBe("123");
		expect(parsed?.groups?.source).toBe("some-branch");
	});

	it("should detect a ssh github git host", () => {
		const gitHost = detectGitHubOptions("git@github.com:ORGANISATION/REPOSITORY.git");

		expect(gitHost?.hostName).toBe("GitHub");
		expect(gitHost?.changelogOptions?.commitUrlFormat).toBe(
			"https://github.com/ORGANISATION/REPOSITORY/commit/{{hash}}",
		);
		expect(gitHost?.changelogOptions?.compareUrlFormat).toBe(
			"https://github.com/ORGANISATION/REPOSITORY/compare/{{previousTag}}...{{currentTag}}",
		);
		expect(gitHost?.changelogOptions?.issueUrlFormat).toBe(
			"https://github.com/ORGANISATION/REPOSITORY/issues/{{id}}",
		);

		expect(gitHost?.commitParserOptions?.mergePattern).toBeDefined();
		const parsed = gitHost?.commitParserOptions?.mergePattern?.exec(
			"Merge pull request #123 from some-branch",
		);
		expect(parsed?.groups?.id).toBe("123");
		expect(parsed?.groups?.source).toBe("some-branch");
	});

	it("should return undefined if not a github url", () => {
		const gitHost = detectGitHubOptions("");

		expect(gitHost).toBeUndefined();
	});
});
