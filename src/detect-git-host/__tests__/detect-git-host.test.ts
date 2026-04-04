import { setupTest } from "../../../tests/setup-tests";
import { detectGitHost } from "../../detect-git-host/detect-git-host";

describe("detect-git-host", () => {
	it("should detect an azure git host", async () => {
		const { execGit, testFolder } = await setupTest("detect-git-host");

		await execGit.raw(
			"remote",
			"add",
			"origin",
			"https://ORGANISATION@dev.azure.com/ORGANISATION/PROJECT/_git/REPOSITORY",
		);

		const gitHost = await detectGitHost(testFolder);

		expect(gitHost?.hostName).toBe("Azure Devops");
		expect(gitHost?.changelogOptions.commitUrlFormat).toBe(
			"{{host}}/ORGANISATION/PROJECT/_git/REPOSITORY/commit/{{hash}}",
		);
		expect(gitHost?.changelogOptions.compareUrlFormat).toBe(
			"{{host}}/ORGANISATION/PROJECT/_git/REPOSITORY/branchCompare?baseVersion=GT{{previousTag}}&targetVersion=GT{{currentTag}}",
		);
		expect(gitHost?.changelogOptions.issueUrlFormat).toBe(
			"{{host}}/ORGANISATION/PROJECT/_workitems/edit/{{id}}",
		);

		expect(gitHost?.commitParserOptions?.mergePattern).toBeDefined();
		const parsed = gitHost?.commitParserOptions?.mergePattern?.exec("Merged PR 123: some-branch");
		expect(parsed?.groups?.id).toBe("123");
		expect(parsed?.groups?.source).toBe("some-branch");
	});

	it("should not throw when no remote defined", async () => {
		const { testFolder } = await setupTest("detect-git-host");

		await expect(detectGitHost(testFolder)).resolves.toBeNull();
	});
});
