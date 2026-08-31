import { detectGenericGitHost } from "../host-generic";

describe("host-generic", () => {
	it("should detect a https remote on a self-hosted domain", () => {
		const gitHost = detectGenericGitHost("https://git.example.com/ORGANISATION/REPOSITORY.git");

		expect(gitHost?.hostName).toBe("https://git.example.com");
		expect(gitHost?.changelogWriter?.commitUrlFormat).toBe(
			"https://git.example.com/ORGANISATION/REPOSITORY/commit/{{hash}}",
		);
		expect(gitHost?.changelogWriter?.compareUrlFormat).toBe(
			"https://git.example.com/ORGANISATION/REPOSITORY/compare/{{previousTag}}...{{currentTag}}",
		);
		expect(gitHost?.changelogWriter?.issueUrlFormat).toBe(
			"https://git.example.com/ORGANISATION/REPOSITORY/issues/{{id}}",
		);
	});

	it("should detect a https remote with no .git suffix", () => {
		const gitHost = detectGenericGitHost("https://git.example.com/ORGANISATION/REPOSITORY");

		expect(gitHost?.changelogWriter?.commitUrlFormat).toBe(
			"https://git.example.com/ORGANISATION/REPOSITORY/commit/{{hash}}",
		);
	});

	it("should keep http remotes as http", () => {
		const gitHost = detectGenericGitHost("http://git.example.com/ORGANISATION/REPOSITORY.git");

		expect(gitHost?.hostName).toBe("http://git.example.com");
	});

	it("should strip embedded userinfo from a https remote", () => {
		const gitHost = detectGenericGitHost(
			"https://user@git.example.com/ORGANISATION/REPOSITORY.git",
		);

		expect(gitHost?.hostName).toBe("https://git.example.com");
	});

	it("should detect a scp-style ssh remote", () => {
		const gitHost = detectGenericGitHost("git@git.example.com:ORGANISATION/REPOSITORY.git");

		expect(gitHost?.hostName).toBe("https://git.example.com");
		expect(gitHost?.changelogWriter?.commitUrlFormat).toBe(
			"https://git.example.com/ORGANISATION/REPOSITORY/commit/{{hash}}",
		);
	});

	it("should detect a ssh:// url remote, ignoring the port", () => {
		const gitHost = detectGenericGitHost(
			"ssh://git@git.example.com:2222/ORGANISATION/REPOSITORY.git",
		);

		expect(gitHost?.hostName).toBe("https://git.example.com");
		expect(gitHost?.changelogWriter?.commitUrlFormat).toBe(
			"https://git.example.com/ORGANISATION/REPOSITORY/commit/{{hash}}",
		);
	});

	it("should return undefined for an empty or unparseable url", () => {
		expect(detectGenericGitHost("")).toBeUndefined();
		expect(detectGenericGitHost("not a url")).toBeUndefined();
	});
});
