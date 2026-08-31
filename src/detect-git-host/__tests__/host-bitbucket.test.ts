import { detectBitbucketOptions } from "../host-bitbucket";

describe("host-bitbucket", () => {
	it("should detect a https bitbucket git host with workspace", () => {
		const gitHost = detectBitbucketOptions(
			"https://WORKSPACE@bitbucket.org/ORGANISATION/REPOSITORY.git",
		);

		expect(gitHost?.hostName).toBe("Bitbucket");
		expect(gitHost?.changelogWriter?.commitUrlFormat).toBe(
			"https://bitbucket.org/ORGANISATION/REPOSITORY/commits/{{hash}}",
		);
		expect(gitHost?.changelogWriter?.compareUrlFormat).toBe(
			"https://bitbucket.org/ORGANISATION/REPOSITORY/branches/compare/{{currentTag}}..{{previousTag}}",
		);
		expect(gitHost?.changelogWriter?.issueUrlFormat).toBe(
			"https://bitbucket.org/ORGANISATION/REPOSITORY/issues/{{id}}",
		);

		expect(gitHost?.commitParser?.mergePattern).toBeDefined();
		const parsed = gitHost?.commitParser?.mergePattern?.exec(
			"Merged in some-branch (pull request #123)",
		);
		expect(parsed?.groups?.id).toBe("123");
		expect(parsed?.groups?.source).toBe("some-branch");
	});

	it("should detect a https bitbucket git host with workspace and bitbucket.com domain", () => {
		const gitHost = detectBitbucketOptions(
			"https://WORKSPACE@bitbucket.com/ORGANISATION/REPOSITORY.git",
		);

		expect(gitHost?.hostName).toBe("Bitbucket");
		expect(gitHost?.changelogWriter?.commitUrlFormat).toBe(
			"https://bitbucket.com/ORGANISATION/REPOSITORY/commits/{{hash}}",
		);
		expect(gitHost?.changelogWriter?.compareUrlFormat).toBe(
			"https://bitbucket.com/ORGANISATION/REPOSITORY/branches/compare/{{currentTag}}..{{previousTag}}",
		);
		expect(gitHost?.changelogWriter?.issueUrlFormat).toBe(
			"https://bitbucket.com/ORGANISATION/REPOSITORY/issues/{{id}}",
		);

		expect(gitHost?.commitParser?.mergePattern).toBeDefined();
		const parsed = gitHost?.commitParser?.mergePattern?.exec(
			"Merged in some-branch (pull request #123)",
		);
		expect(parsed?.groups?.id).toBe("123");
		expect(parsed?.groups?.source).toBe("some-branch");
	});

	it("should detect a https bitbucket git host without workspace", () => {
		const gitHost = detectBitbucketOptions("https://bitbucket.org/ORGANISATION/REPOSITORY.git");

		expect(gitHost?.hostName).toBe("Bitbucket");
		expect(gitHost?.changelogWriter?.commitUrlFormat).toBe(
			"https://bitbucket.org/ORGANISATION/REPOSITORY/commits/{{hash}}",
		);
		expect(gitHost?.changelogWriter?.compareUrlFormat).toBe(
			"https://bitbucket.org/ORGANISATION/REPOSITORY/branches/compare/{{currentTag}}..{{previousTag}}",
		);
		expect(gitHost?.changelogWriter?.issueUrlFormat).toBe(
			"https://bitbucket.org/ORGANISATION/REPOSITORY/issues/{{id}}",
		);

		expect(gitHost?.commitParser?.mergePattern).toBeDefined();
		const parsed = gitHost?.commitParser?.mergePattern?.exec(
			"Merged in some-branch (pull request #123)",
		);
		expect(parsed?.groups?.id).toBe("123");
		expect(parsed?.groups?.source).toBe("some-branch");
	});

	it("should detect a ssh bitbucket git host", () => {
		const gitHost = detectBitbucketOptions("git@bitbucket.org:ORGANISATION/REPOSITORY.git");

		expect(gitHost?.hostName).toBe("Bitbucket");
		expect(gitHost?.changelogWriter?.commitUrlFormat).toBe(
			"https://bitbucket.org/ORGANISATION/REPOSITORY/commits/{{hash}}",
		);
		expect(gitHost?.changelogWriter?.compareUrlFormat).toBe(
			"https://bitbucket.org/ORGANISATION/REPOSITORY/branches/compare/{{currentTag}}..{{previousTag}}",
		);
		expect(gitHost?.changelogWriter?.issueUrlFormat).toBe(
			"https://bitbucket.org/ORGANISATION/REPOSITORY/issues/{{id}}",
		);

		expect(gitHost?.commitParser?.mergePattern).toBeDefined();
		const parsed = gitHost?.commitParser?.mergePattern?.exec(
			"Merged in some-branch (pull request #123)",
		);
		expect(parsed?.groups?.id).toBe("123");
		expect(parsed?.groups?.source).toBe("some-branch");
	});

	it("should return undefined if not a bitbucket url", () => {
		const gitHost = detectBitbucketOptions("");

		expect(gitHost).toBeUndefined();
	});
});
