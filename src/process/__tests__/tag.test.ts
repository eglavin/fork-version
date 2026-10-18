import { setupTest } from "../../../tests/setup-tests";
import { tagChanges } from "../tag";

describe("tagChanges", () => {
	it("should create a tag", async () => {
		const { config, execGit, git, logger } = await setupTest("tagChanges");

		execGit.commit("feat: A feature commit");
		await tagChanges(config, logger, git, "1.2.4");

		await expect(execGit.raw("tag")).resolves.toContain("v1.2.4");
	});

	it("should throw an error if the tag already exists", async () => {
		const { config, execGit, git, logger } = await setupTest("tagChanges");

		execGit.commit("feat: A feature commit");
		await tagChanges(config, logger, git, "1.2.4");

		await expect(tagChanges(config, logger, git, "1.2.4")).rejects.toThrow(
			"tag 'v1.2.4' already exists",
		);
	});

	it("should skip tag creation", async () => {
		const { config, execGit, git, logger } = await setupTest("tagChanges");
		config.skipTag = true;

		execGit.commit("feat: A feature commit");
		await tagChanges(config, logger, git, "1.2.4");

		await expect(execGit.raw("tag")).resolves.not.toContain("v1.2.4");
	});

	it("should not parse a tag starting with a dash as a git option", async () => {
		const { config, execGit, git, logger } = await setupTest("tagChanges");
		config.tagPrefix = "--force-v";

		execGit.commit("feat: A feature commit");
		await expect(tagChanges(config, logger, git, "1.2.4")).rejects.toThrow(
			"'--force-v1.2.4' is not a valid tag name",
		);
	});
});
