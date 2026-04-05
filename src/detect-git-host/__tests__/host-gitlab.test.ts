import { detectGitlabOptions } from "../host-gitlab";

describe("host-gitlab", () => {
	it("should detect a https gitlab git host", () => {
		const gitHost = detectGitlabOptions("https://gitlab.com/ORGANISATION/REPOSITORY.git");

		expect(gitHost?.hostName).toBe("GitLab");
		expect(gitHost?.changelogOptions?.commitUrlFormat).toBe(
			"https://gitlab.com/ORGANISATION/REPOSITORY/-/commit/{{hash}}",
		);
		expect(gitHost?.changelogOptions?.compareUrlFormat).toBe(
			"https://gitlab.com/ORGANISATION/REPOSITORY/-/compare/{{previousTag}}...{{currentTag}}",
		);
		expect(gitHost?.changelogOptions?.issueUrlFormat).toBe(
			"https://gitlab.com/ORGANISATION/REPOSITORY/-/issues/{{id}}",
		);

		expect(gitHost?.commitParserOptions?.mergePattern).toBeDefined();
		const parsed = gitHost?.commitParserOptions?.mergePattern?.exec(
			"Merge branch 'some-branch' into 'main'",
		);
		expect(parsed?.groups?.source).toBe("some-branch");
	});

	it("should detect a ssh gitlab git host", () => {
		const gitHost = detectGitlabOptions("git@gitlab.com:ORGANISATION/REPOSITORY.git");

		expect(gitHost?.hostName).toBe("GitLab");
		expect(gitHost?.changelogOptions?.commitUrlFormat).toBe(
			"https://gitlab.com/ORGANISATION/REPOSITORY/-/commit/{{hash}}",
		);
		expect(gitHost?.changelogOptions?.compareUrlFormat).toBe(
			"https://gitlab.com/ORGANISATION/REPOSITORY/-/compare/{{previousTag}}...{{currentTag}}",
		);
		expect(gitHost?.changelogOptions?.issueUrlFormat).toBe(
			"https://gitlab.com/ORGANISATION/REPOSITORY/-/issues/{{id}}",
		);

		expect(gitHost?.commitParserOptions?.mergePattern).toBeDefined();
		const parsed = gitHost?.commitParserOptions?.mergePattern?.exec(
			"Merge branch 'some-branch' into 'main'",
		);
		expect(parsed?.groups?.source).toBe("some-branch");
	});

	it("should return undefined if not a gitlab url", () => {
		const gitHost = detectGitlabOptions("");

		expect(gitHost).toBeUndefined();
	});
});
