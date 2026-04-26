import { setupTest } from "../../../tests/setup-tests";
import { IS_E2E } from "../../../tests/options";
import { CommitParser } from "../../commit-parser/commit-parser";
import { Git } from "../git";

describe("git", () => {
	it("should accept arguments", async () => {
		const { config, create, execGit } = await setupTest("execute-file");
		const git = new Git(config);

		create.json({ version: "1.0.0" }, "package.json").add();
		execGit.commits();

		await git.commit("--allow-empty", "-m", "test: test arguments works");

		await expect(execGit.raw("log", "--oneline")).resolves.toContain("test: test arguments works");
	});

	it("should be able to tag commits", async () => {
		const { config, create, execGit } = await setupTest("execute-file");
		const git = new Git(config);

		create.json({ version: "1.0.0" }, "package.json").add();
		execGit.commits();

		await git.commit("--allow-empty", "-m", "test: test arguments works");
		await git.tag("v1.0.0", "-m", "test: test arguments works");

		await expect(execGit.raw("status", "--porcelain")).resolves.toBe("");
	});

	it("should not commit files if dryRun is enabled", async () => {
		const { config, create, execGit } = await setupTest("execute-file");
		config.dryRun = true;
		const git = new Git(config);

		create.json({ version: "1.0.0" }, "package.json").add();
		execGit.commits();

		await git.commit("--allow-empty", "-m", "test: test arguments works");

		await expect(execGit.raw("log", "--oneline")).resolves.not.toContain(
			"test: test arguments works",
		);
	});

	it("should not add files if dryRun is enabled", async () => {
		const { config, create, execGit } = await setupTest("execute-file");
		config.dryRun = true;
		const git = new Git(config);

		create.file("\n", "file.txt");
		execGit.commits();

		await git.add("file.txt");

		await expect(execGit.raw("status", "--porcelain")).resolves.toBe("?? file.txt\n");
	});

	it("should not tag commits if dryRun is enabled", async () => {
		const { config, create, execGit } = await setupTest("execute-file");
		config.dryRun = true;
		const git = new Git(config);

		create.json({ version: "1.0.0" }, "package.json").add();
		execGit.commits();

		await git.commit("--allow-empty", "-m", "test: test arguments works");
		await git.tag("v1.0.0", "-m", "test: test arguments works");

		await expect(execGit.raw("rev-list", "-n", "1", "v1.0.0")).rejects.toThrow(
			/unknown revision or path not in the working tree/,
		);
	});

	it("should log if error is thrown", async () => {
		const { config, create, execGit } = await setupTest("execute-file");
		const git = new Git(config);

		create.json({ version: "1.0.0" }, "package.json").add();
		execGit.commits();

		await expect(async () => await git.add("non-existing-file")).rejects.toThrowError(
			"Command failed: git add non-existing-file\nfatal: pathspec 'non-existing-file' did not match any files",
		);
	});

	it("should be able to get the current branch", async () => {
		const { config, create, execGit } = await setupTest("execute-file");
		const git = new Git(config);

		create.json({ version: "1.0.0" }, "package.json").add();
		execGit.commits();

		const branch = await git.getBranchName();
		expect(branch).toBe("main");
	});

	it("should handle no branch name", async () => {
		const { config } = await setupTest("execute-file");
		const git = new Git(config);

		// No commits, so no branch name
		await expect(git.getBranchName()).resolves.toBe("");
	});

	it("should be able to get the remote url", async () => {
		const { config, create, execGit } = await setupTest("execute-file");

		const git = new Git(config);

		create.json({ version: "1.0.0" }, "package.json").add();
		execGit.commits();

		// No remote set
		await expect(git.getRemoteUrl()).resolves.toBe("");

		// Set remote and test again
		await execGit.raw("remote", "add", "origin", "https://github.com/eglavin/fork-version-unknown");
		await expect(git.getRemoteUrl()).resolves.toBe(
			"https://github.com/eglavin/fork-version-unknown",
		);
	});

	it("should handle no remote url", async () => {
		const { config } = await setupTest("execute-file");
		const git = new Git(config);

		// No commits, so no remote url
		await expect(git.getRemoteUrl()).resolves.toBe("");
	});

	it("should check if a file is ignored by git", async () => {
		const { config, create } = await setupTest("execute-file");
		const git = new Git(config);

		create
			.file(
				`
src/*.txt
test/**
`,
				".gitignore",
			)
			.add();

		create.directory("src");
		create.file("", "src", "my-file.txt");
		create.file("", "src", "my-file.js");
		await expect(git.isIgnored("src/my-file.txt")).resolves.toBe(true);
		await expect(git.isIgnored("src/my-file.js")).resolves.toBe(false);

		create.directory("test");
		create.file("", "test", "my-file.txt");
		await expect(git.isIgnored("test/my-file.txt")).resolves.toBe(true);
	});

	it("should only return tags that match the provided tagPrefix", async () => {
		const { config } = await setupTest("execute-file");
		const git = new Git(config);

		await git.commit("--allow-empty", "-m", "test: a commit");
		await git.tag("@fork-version/1.0.0", "-m", "chore: release v1.0.0");

		await git.commit("--allow-empty", "-m", "test: another commit");
		await git.tag("v1.0.1", "-m", "chore: release v1.0.1");

		await git.commit("--allow-empty", "-m", "test: another another commit");
		await git.tag("1.0.2", "-m", "chore: release 1.0.2");

		await expect(git.getTags("@fork-version/")).resolves.toStrictEqual(["@fork-version/1.0.0"]);
		await expect(git.getTags("v")).resolves.toStrictEqual(["v1.0.1"]);
		await expect(git.getTags("")).resolves.toStrictEqual(["1.0.2"]);
		await expect(git.getTags("non-existing-prefix")).resolves.toStrictEqual([]);
	});

	it("should return tags sorted by most recent commit", async () => {
		const { config } = await setupTest("execute-file");
		const git = new Git(config);

		await git.commit("--allow-empty", "-m", "test: a commit");
		await git.tag("v1.0.0", "-m", "chore: release v1.0.0");

		await git.commit("--allow-empty", "-m", "test: another commit");
		await git.tag("v1.0.1", "-m", "chore: release v1.0.1");

		await git.commit("--allow-empty", "-m", "test: another another commit");
		await git.tag("v1.0.2", "-m", "chore: release v1.0.2");

		await expect(git.getTags("v")).resolves.toStrictEqual(["v1.0.2", "v1.0.1", "v1.0.0"]);
	});

	it("should return tags with special regex characters in prefix", async () => {
		const { config } = await setupTest("execute-file");
		const git = new Git(config);

		await git.commit("--allow-empty", "-m", "test: a commit");
		await git.tag("fork-version$1.0.0", "-m", "chore: release fork-version$1.0.0");

		await git.commit("--allow-empty", "-m", "test: another commit");
		await git.tag("fork-version$1.0.1", "-m", "chore: release fork-version$1.0.1");

		await git.commit("--allow-empty", "-m", "test: another another commit");
		await git.tag("fork-version/lib;1.0.2", "-m", "chore: release fork-version/lib;1.0.2");

		await git.commit("--allow-empty", "-m", "test: another another another commit");
		await git.tag("fork-version'2.1.0", "-m", "chore: release fork-version'2.1.0");

		await expect(git.getTags("fork-version$")).resolves.toStrictEqual([
			"fork-version$1.0.1",
			"fork-version$1.0.0",
		]);

		await expect(git.getTags("fork-version/lib;")).resolves.toStrictEqual([
			"fork-version/lib;1.0.2",
		]);

		await expect(git.getTags("fork-version'")).resolves.toStrictEqual(["fork-version'2.1.0"]);
	});

	it("should handle no tags", async () => {
		const { config } = await setupTest("execute-file");
		const git = new Git(config);

		await expect(git.getTags(config.tagPrefix)).resolves.toStrictEqual([]);
	});

	it("should return all tags if not currently running in prerelease mode", async () => {
		const { config } = await setupTest("execute-file");
		const git = new Git(config);

		await git.commit("--allow-empty", "-m", "test: a commit");
		await git.tag("v1.0.0", "-m", "chore: release v1.0.0");

		await git.commit("--allow-empty", "-m", "test: another commit");
		await git.tag("v1.0.1-alpha.0", "-m", "chore: release v1.0.1-alpha.0");

		await git.commit("--allow-empty", "-m", "test: another another commit");
		await git.tag("v1.0.1-beta.0", "-m", "chore: release v1.0.1-beta.0");

		await git.commit("--allow-empty", "-m", "test: another another another commit");
		await git.tag("v1.0.2-0", "-m", "chore: release v1.0.2-0");

		await expect(git.getTags("v", false)).resolves.toStrictEqual([
			"v1.0.2-0",
			"v1.0.1-beta.0",
			"v1.0.1-alpha.0",
			"v1.0.0",
		]);
	});

	it("should return only tags that match the prerelease identifier", async () => {
		const { config } = await setupTest("execute-file");
		const git = new Git(config);

		await git.commit("--allow-empty", "-m", "test: a commit");
		await git.tag("v1.0.0", "-m", "chore: release v1.0.0");

		await git.commit("--allow-empty", "-m", "test: another commit");
		await git.tag("v1.0.1-alpha.0", "-m", "chore: release v1.0.1-alpha.0");

		await git.commit("--allow-empty", "-m", "test: another another commit");
		await git.tag("v1.0.1-beta.0", "-m", "chore: release v1.0.1-beta.0");

		await git.commit("--allow-empty", "-m", "test: another another another commit");
		await git.tag("v1.0.2-0", "-m", "chore: release v1.0.2-0");

		await expect(git.getTags("v", "alpha")).resolves.toStrictEqual(["v1.0.1-alpha.0", "v1.0.0"]);
		await expect(git.getTags("v", "beta")).resolves.toStrictEqual(["v1.0.1-beta.0", "v1.0.0"]);
		await expect(git.getTags("v", true)).resolves.toStrictEqual(["v1.0.2-0", "v1.0.0"]);
	});

	it("should read commits", async () => {
		const { config, create } = await setupTest("execute-file");
		const git = new Git(config);

		// Create a commit in the root src folder
		create.directory("src");
		create.file("", "src", "file1.txt");
		await git.add("src/file1.txt");
		await git.commit(
			"-m",
			"feat: initial commit",
			"-m",
			"BREAKING CHANGE: this is a breaking change",
		);
		await git.tag("v1.0.0");

		// Create a commit in the src/libs folder
		create.directory("src", "libs");
		create.file("", "src", "libs", "file2.txt");
		await git.add("src/libs/file2.txt");
		await git.commit("-m", "refactor: add lib file");
		await git.tag("v1.0.1");

		// Create a commit in the src/utils folder
		create.directory("src", "utils");
		create.file("", "src", "utils", "file3.txt");
		await git.add("src/utils/file3.txt");
		await git.commit("-m", "refactor: add util file");
		await git.tag("v1.0.2");

		// Create a commit in the src/test folder
		create.directory("src", "test");
		create.file("", "src", "test", "file4.txt");
		await git.add("src/test/file4.txt");
		await git.commit("-m", "refactor: add test file");
		await git.tag("v1.0.3");

		// Create a commit with a long title and a message body
		create.file("", "src", "test", "file5.txt");
		await git.add("src/test/file5.txt");
		await git.commit(
			"-m",
			`refactor: this is a long commit message with a lot of content in it
which I'm wondering how it would be handled by the commit log parsing
system so we'll see what happens.`,
			"-m",
			"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
		);
		await git.tag("v1.0.4");

		// Get commits in specific folders
		const filteredCommits = await git.getCommits("v1.0.1", "HEAD", "src/libs", "src/utils");
		expect(filteredCommits[0].includes("refactor: add util file")).toBe(true);
		expect(filteredCommits.length).toBe(1);

		// Get commits in all folders
		const commitsFrom100 = await git.getCommits("v1.0.0");
		expect(
			commitsFrom100[0].includes(
				"refactor: this is a long commit message with a lot of content in it which I'm wondering how it would be handled by the commit log parsing system so we'll see what happens.",
			),
		).toBe(true);
		expect(commitsFrom100[1].includes("refactor: add test file")).toBe(true);
		expect(commitsFrom100[2].includes("refactor: add util file")).toBe(true);
		expect(commitsFrom100[3].includes("refactor: add lib file")).toBe(true);
		expect(commitsFrom100.length).toBe(4);

		// Get all commits
		const allCommits = await git.getCommits();
		expect(
			allCommits[0].includes(
				"refactor: this is a long commit message with a lot of content in it which I'm wondering how it would be handled by the commit log parsing system so we'll see what happens.",
			),
		).toBe(true);
		expect(allCommits[1].includes("refactor: add test file")).toBe(true);
		expect(allCommits[2].includes("refactor: add util file")).toBe(true);
		expect(allCommits[3].includes("refactor: add lib file")).toBe(true);
		expect(allCommits[4].includes("feat: initial commit")).toBe(true);
		expect(allCommits.length).toBe(5);
	});

	it("should handle folder with no commits", async () => {
		const { config, create } = await setupTest("execute-file");
		const git = new Git(config);

		// Create a commit in the root src folder
		create.directory("src");
		create.file("", "src", "file1.txt");
		await git.add("src/file1.txt");
		await git.commit(
			"-m",
			"feat: initial commit",
			"-m",
			"BREAKING CHANGE: this is a breaking change",
		);
		await git.tag("v1.0.0");

		// Create a commit in the src/libs folder
		create.directory("src", "libs");
		create.file("", "src", "libs", "file2.txt");
		await git.add("src/libs/file2.txt");
		await git.commit("-m", "refactor: add lib file");
		await git.tag("v1.0.1");

		const commits = await git.getCommits(undefined, undefined, "non-existing-folder");
		expect(commits.length).toBe(0);
	});

	it("should handle no commits", async () => {
		const { config } = await setupTest("execute-file");
		const git = new Git(config);

		const commits = await git.getCommits();
		expect(commits).toStrictEqual([]);
	});

	it("should handle unset user email in git config", async () => {
		const { config, create } = await setupTest("execute-file", {
			userName: "Test User",
			userEmail: "",
		});
		const git = new Git(config);

		create.json({ version: "1.0.0" }, "package.json").add();
		await git.commit("--allow-empty", "-m", "test: test arguments works");

		const commits = await git.getCommits();
		const [subject, , , , , name, email] = commits[0].split("\n");

		expect(subject).toBe("test: test arguments works");
		expect(name).toBe("Test User");
		expect(email).toBe("");
	});

	it("should read commits and tags", async () => {
		const { config, create } = await setupTest("execute-file");
		const git = new Git(config);

		// Create a commit in the root src folder
		create.directory("src");
		create.file("", "src", "file1.txt");
		await git.add("src/file1.txt");
		await git.commit("-m", "feat: initial commit");
		await git.tag("v1.0.0");

		// Create a commit in the src/libs folder
		create.directory("src", "libs");
		create.file("", "src", "libs", "file2.txt");
		await git.add("src/libs/file2.txt");
		await git.commit("-m", "refactor: add lib file");
		await git.tag("v1.0.1");
		await git.tag("v1.0.2");
		await git.tag("v1.0.2-alpha.0");
		await git.tag("v1.0.2-alpha.1");

		// Create a commit in the src/utils folder
		create.directory("src", "utils");
		create.file("", "src", "utils", "file3.txt");
		await git.add("src/utils/file3.txt");
		await git.commit("-m", "refactor: add util file");
		await git.tag("v1.0.3");

		const commits = await git.getCommits();

		{
			const [subject, , , ref] = commits[0].split("\n");
			expect(subject).toBe("refactor: add util file");
			expect(ref).toBe(" (HEAD -> main, tag: v1.0.3)");
		}

		{
			const [subject, , , ref] = commits[1].split("\n");
			expect(subject).toBe("refactor: add lib file");
			expect(ref).toBe(" (tag: v1.0.2-alpha.1, tag: v1.0.2-alpha.0, tag: v1.0.2, tag: v1.0.1)");
		}

		{
			const [subject, , , ref] = commits[2].split("\n");
			expect(subject).toBe("feat: initial commit");
			expect(ref).toBe(" (tag: v1.0.0)");
		}
	});

	it("should handle out of order commits", { timeout: 10_000, skip: !IS_E2E }, async () => {
		const { config, create, execGit, sleep } = await setupTest("execute-file");
		const git = new Git(config);

		create.directory("src");
		create.file("File 1 content", "src", "file1.txt").add();
		await git.commit("-m", "feat: initial commit");
		await git.tag("v1.0.0");

		await sleep(1000);

		// Create a long lived branch and commit to it, but don't merge it yet so that the commit is out of order in the git log
		await execGit.raw("checkout", "-b", "long-lived-feature-branch");
		create.file("File 2 content", "src", "file2.txt").add();
		await git.commit("-m", "feat: add file2");
		await execGit.raw("checkout", "main");

		await sleep(1000);

		// Create two short lived branches and merge them in quick succession to create out of order commits in the git log
		await execGit.raw("checkout", "-b", "quick-feature-branch");
		create.file("File 3 content", "src", "file3.txt").add();
		await git.commit("-m", "feat: add file3");
		await execGit.raw("checkout", "main");

		await sleep(1000);

		await execGit.raw("merge", "quick-feature-branch", "--no-ff");
		await git.tag("v1.1.0");

		await sleep(1000);

		await execGit.raw("checkout", "-b", "quick-bugfix-branch");
		create.file("File 4 content", "src", "file4.txt").add();
		await git.commit("-m", "fix: add file4");
		await execGit.raw("checkout", "main");

		await sleep(1000);

		await execGit.raw("merge", "quick-bugfix-branch", "--no-ff");
		await git.tag("v1.1.1");

		await sleep(1000);

		// Merge the long lived branch last so that its commit is out of order in the git log
		await execGit.raw("merge", "long-lived-feature-branch", "--no-ff");
		await git.tag("v1.2.0");

		const commits = await git.getCommits();

		const commitParser = new CommitParser();
		const parsedCommits = commits.map(commitParser.parseRawCommit);

		expect(parsedCommits.length).toBe(7);
		{
			const { subject, refNames } = parsedCommits[0];
			expect(subject).toBe("Merge branch 'long-lived-feature-branch'");
			expect(refNames).toBe("(HEAD -> main, tag: v1.2.0)");
		}
		{
			const { subject, refNames } = parsedCommits[1];
			expect(subject).toBe("Merge branch 'quick-bugfix-branch'");
			expect(refNames).toBe("(tag: v1.1.1)");
		}
		{
			const { subject, refNames } = parsedCommits[2];
			expect(subject).toBe("fix: add file4");
			expect(refNames).toBe("(quick-bugfix-branch)");
		}
		{
			const { subject, refNames } = parsedCommits[3];
			expect(subject).toBe("Merge branch 'quick-feature-branch'");
			expect(refNames).toBe("(tag: v1.1.0)");
		}
		{
			const { subject, refNames } = parsedCommits[4];
			expect(subject).toBe("feat: add file3");
			expect(refNames).toBe("(quick-feature-branch)");
		}
		{
			const { subject, refNames } = parsedCommits[5];
			expect(subject).toBe("feat: add file2");
			expect(refNames).toBe("(long-lived-feature-branch)");
		}
		{
			const { subject, refNames } = parsedCommits[6];
			expect(subject).toBe("feat: initial commit");
			expect(refNames).toBe("(tag: v1.0.0)");
		}
	});
});
