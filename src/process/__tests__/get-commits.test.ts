import { setupTest } from "../../../tests/setup-tests";
import { getCommitsSinceTag } from "../get-commits";

describe("get-commits", () => {
	it("should get commits since last tag", async () => {
		const { config, execGit, git, logger } = await setupTest("get-commits");

		execGit.commit("chore: init");
		execGit.tag("v0.0.0", "chore: init");

		execGit.commit("feat!: a feat commit");
		execGit.tag("v1.0.0", "feat!: a feat commit");

		execGit.commit("refactor: a refactor commit");
		execGit.tag("v0.0.1", "refactor: a refactor commit");

		execGit.commit("feat: an amazing new feature");

		const { latestTag, commits } = await getCommitsSinceTag(config, logger, git);

		expect(latestTag).toBe("v0.0.1");

		expect(commits).toHaveLength(1);
		expect(commits[0]?.subject).toBe("feat: an amazing new feature");
		expect(commits[0]?.type).toBe("feat");
		expect(commits[0]?.title).toBe("an amazing new feature");
	});

	it("should return commits only for the given sub directory", async () => {
		const { config, execGit, create, git, logger } = await setupTest("get-commits");

		execGit.commit("chore: init");
		execGit.tag("v0.0.0", "chore: init");

		create.directory("packages/package-1");
		create.file("", "packages/package-1/package.json").add();
		execGit.commit("feat: package-1 feat");

		create.directory("packages/package-2");
		create.file("", "packages/package-2/package.json").add();
		execGit.commit("feat: package-2 feat");

		const { latestTag, commits } = await getCommitsSinceTag(config, logger, git);

		expect(latestTag).toBe("v0.0.0");

		expect(commits).toHaveLength(2);
		expect(commits[0]?.subject).toBe("feat: package-2 feat");
		expect(commits[1]?.subject).toBe("feat: package-1 feat");
	});
});
