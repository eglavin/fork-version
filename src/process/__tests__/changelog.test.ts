import { existsSync, readFileSync } from "node:fs";

import { setupTest } from "../../../tests/setup-tests";
import { getCommitsSinceTag } from "../get-commits";
import { updateChangelog, describeChangelogDifference } from "../changelog";

describe("changelog", () => {
	it("should create changelog file", async () => {
		const { config, execGit, git, logger, relativeTo } = await setupTest("changelog");

		execGit.commit("feat: A feature commit", "BREAKING CHANGE: A breaking change message");
		const { commits, latestTag } = await getCommitsSinceTag(config, logger, git);

		expect(existsSync(relativeTo("CHANGELOG.md"))).toBe(false);
		await updateChangelog(config, logger, commits, latestTag, "1.2.4");
		expect(existsSync(relativeTo("CHANGELOG.md"))).toBe(true);
	});

	it("should update changelog file", async () => {
		const { config, create, execGit, git, logger, relativeTo } = await setupTest("changelog");

		create
			.file(
				`# Test Header

## 1.2.3 (2000-01-01)
`,
				"CHANGELOG.md",
			)
			.add();
		execGit.commit("feat: A feature commit", "BREAKING CHANGE: A breaking change message");
		const { commits, latestTag } = await getCommitsSinceTag(config, logger, git);

		await updateChangelog(config, logger, commits, latestTag, "1.2.4");

		const changelog = readFileSync(relativeTo("CHANGELOG.md"), "utf8");
		expect(changelog).toContain("## 1.2.3");
		expect(changelog).toContain("## 1.2.4");
		expect(changelog).toContain("### Features");
		expect(changelog).toContain("A feature commit");
		expect(changelog).toContain("### ⚠ BREAKING CHANGES");
		expect(changelog).toContain("A breaking change message");
	});

	it("should throw an error if header contains a release pattern", async () => {
		const { config, create, execGit, git, logger } = await setupTest("changelog");
		config.header = "# [1.2.3]\n";

		create
			.file(
				`# Test Header

## 1.2.3 (2000-01-01)
`,
				"CHANGELOG.md",
			)
			.add();
		execGit.commit("feat: A feature commit", "BREAKING CHANGE: A breaking change message");
		const { commits, latestTag } = await getCommitsSinceTag(config, logger, git);

		await expect(updateChangelog(config, logger, commits, latestTag, "1.2.4")).rejects.toThrow(
			"Header cannot contain release pattern",
		);
	});

	it("should not update changelog if dryRun is set", async () => {
		const { config, create, execGit, git, logger, relativeTo } = await setupTest("changelog");
		config.dryRun = true;

		create
			.file(
				`# Test Header

## 1.2.3 (2000-01-01)
`,
				"CHANGELOG.md",
			)
			.add();
		execGit.commit("feat: A feature commit", "BREAKING CHANGE: A breaking change message");
		const { commits, latestTag } = await getCommitsSinceTag(config, logger, git);

		await updateChangelog(config, logger, commits, latestTag, "1.2.4");

		const changelog = readFileSync(relativeTo("CHANGELOG.md"), "utf8");
		expect(changelog).toContain("## 1.2.3");
		expect(changelog).not.toContain("## 1.2.4");
	});

	it("should skip changelog update", async () => {
		const { config, create, execGit, git, logger, relativeTo } = await setupTest("changelog");
		config.skipChangelog = true;

		create
			.file(
				`# Test Header

## 1.2.3 (2000-01-01)
`,
				"CHANGELOG.md",
			)
			.add();
		execGit.commit("feat: A feature commit", "BREAKING CHANGE: A breaking change message");
		const { commits, latestTag } = await getCommitsSinceTag(config, logger, git);

		await updateChangelog(config, logger, commits, latestTag, "1.2.4");

		const changelog = readFileSync(relativeTo("CHANGELOG.md"), "utf8");
		expect(changelog).toContain("## 1.2.3");
		expect(changelog).not.toContain("## 1.2.4");
	});

	it("should still write the conventional-changelog output when experimentalChangelogWriter is enabled", async () => {
		const { config, create, execGit, git, logger, relativeTo } = await setupTest("changelog");
		config.experimentalChangelogWriter = true;

		create
			.file(
				`# Test Header

## 1.2.3 (2000-01-01)
`,
				"CHANGELOG.md",
			)
			.add();
		execGit.commit("feat: A feature commit", "BREAKING CHANGE: A breaking change message");
		const { commits, latestTag } = await getCommitsSinceTag(config, logger, git);

		await updateChangelog(config, logger, commits, latestTag, "1.2.4");

		const changelog = readFileSync(relativeTo("CHANGELOG.md"), "utf8");
		expect(changelog).toContain("## 1.2.3");
		expect(changelog).toContain("## 1.2.4");
		expect(changelog).toContain("### Features");
		expect(changelog).toContain("A feature commit");
		expect(changelog).toContain("### ⚠ BREAKING CHANGES");
		expect(changelog).toContain("A breaking change message");
		expect(logger.error).not.toHaveBeenCalled();
	});

	it("should not run the experimental comparison when experimentalChangelogWriter is disabled (default)", async () => {
		const { config, execGit, git, logger } = await setupTest("changelog");
		// config.experimentalChangelogWriter defaults to false

		execGit.commit("feat: A feature commit");
		const { commits, latestTag } = await getCommitsSinceTag(config, logger, git);

		await updateChangelog(config, logger, commits, latestTag, "1.2.4");

		const experimentalWriterMessage = expect.stringContaining("[experimental-changelog-writer]");
		expect(logger.warn).not.toHaveBeenCalledWith(experimentalWriterMessage);
		expect(logger.debug).not.toHaveBeenCalledWith(experimentalWriterMessage);
	});
});

describe("describeChangelogDifference", () => {
	it("returns undefined when the two outputs are identical", () => {
		const content = "## 1.2.4 (2024-01-01)\n\n### Features\n\n* a change\n";
		expect(describeChangelogDifference(content, content)).toBeUndefined();
	});

	it("returns undefined when the two outputs only differ by surrounding whitespace", () => {
		const content = "## 1.2.4 (2024-01-01)\n\n### Features\n\n* a change\n";
		expect(describeChangelogDifference(content, `  ${content}  `)).toBeUndefined();
	});

	it("returns a description containing both outputs when they differ", () => {
		const diff = describeChangelogDifference(
			"## 1.2.4 (2024-01-01)\n\n* legacy change\n",
			"## 1.2.4 (2024-01-01)\n\n* experimental change\n",
		);

		expect(diff).toBeDefined();
		expect(diff).toContain("legacy change");
		expect(diff).toContain("experimental change");
	});
});
