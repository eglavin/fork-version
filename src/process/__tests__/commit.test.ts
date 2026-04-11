import { setupTest } from "../../../tests/setup-tests";
import { commitChanges } from "../commit";

describe("commit", () => {
	it("should commit changed files", async () => {
		const { config, create, execGit, git, logger, relativeTo } = await setupTest("commit");

		create.file("Test content", "CHANGELOG.md");
		create.json({ version: "1.2.3" }, "package.json");
		create.file("Test readme content", "README.md");

		await commitChanges(
			config,
			logger,
			git,
			[
				{ path: relativeTo("CHANGELOG.md"), version: "1.2.4" },
				{ path: relativeTo("package.json"), version: "1.2.4" },
			],
			"1.2.4",
		);

		await expect(execGit.raw("status", "--porcelain")).resolves.toBe("?? README.md\n"); // README.md should not be committed
	});

	it("should not commit if there are no files to commit", async () => {
		const { config, create, execGit, git, logger } = await setupTest("commit");

		create.file("Test readme content", "README.md");

		await commitChanges(config, logger, git, [], "1.2.4");

		await expect(execGit.raw("status", "--porcelain")).resolves.toBe("?? README.md\n"); // README.md should not be committed
	});

	it("should commit all files if commitAll is set to true", async () => {
		const { config, create, execGit, git, logger, relativeTo } = await setupTest("commit");
		config.commitAll = true;

		create.file("Test content", "CHANGELOG.md");
		create.json({ version: "1.2.3" }, "package.json");
		create.file("Test readme content", "README.md");

		await commitChanges(
			config,
			logger,
			git,
			[
				{ path: relativeTo("CHANGELOG.md"), version: "1.2.4" },
				{ path: relativeTo("package.json"), version: "1.2.4" },
			],
			"1.2.4",
		);

		await expect(execGit.raw("status", "--porcelain")).resolves.toBe("");
	});

	it("should skip commit", async () => {
		const { config, create, execGit, git, logger, relativeTo } = await setupTest("commit");
		config.skipCommit = true;

		create.json({ version: "1.2.3" }, "package.json");

		await commitChanges(
			config,
			logger,
			git,
			[{ path: relativeTo("package.json"), version: "1.2.4" }],
			"1.2.4",
		);

		await expect(execGit.raw("status", "--porcelain")).resolves.toBe("?? package.json\n"); // package.json should not be committed
	});
});
