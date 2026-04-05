import { setupTest } from "../../../tests/setup-tests";
import { detectGitHost } from "../../detect-git-host/detect-git-host";

describe("detect-git-host", () => {
	it("should detect a github git host", async () => {
		const { execGit, testFolder } = await setupTest("detect-git-host");

		await execGit.raw("remote", "add", "origin", "https://github.com/ORGANISATION/REPOSITORY.git");

		const gitHost = await detectGitHost(testFolder);

		expect(gitHost?.hostName).toBe("GitHub");
	});

	it("should detect a gitlab git host", async () => {
		const { execGit, testFolder } = await setupTest("detect-git-host");

		await execGit.raw("remote", "add", "origin", "https://gitlab.com/ORGANISATION/REPOSITORY.git");

		const gitHost = await detectGitHost(testFolder);

		expect(gitHost?.hostName).toBe("GitLab");
	});

	it("should detect a bitbucket git host", async () => {
		const { execGit, testFolder } = await setupTest("detect-git-host");

		await execGit.raw(
			"remote",
			"add",
			"origin",
			"https://WORKSPACE@bitbucket.org/ORGANISATION/REPOSITORY.git",
		);

		const gitHost = await detectGitHost(testFolder);

		expect(gitHost?.hostName).toBe("Bitbucket");
	});

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
	});

	it("should not throw when no remote defined", async () => {
		const { testFolder } = await setupTest("detect-git-host");

		await expect(detectGitHost(testFolder)).resolves.toBeUndefined();
	});
});
