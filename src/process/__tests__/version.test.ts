import { setupTest } from "../../../tests/setup-tests";
import { getCurrentVersion, getNextVersion } from "../version";
import { FileManager } from "../../files/file-manager";
import type { Commit } from "../../commit-parser/types";

describe("version > getCurrentVersion", () => {
	it("should be able to read package.json", async () => {
		const { config, create, execGit, git, logger, relativeTo } = await setupTest(
			"version getCurrentVersion",
		);
		const fileManager = new FileManager(config, logger);

		create.json({ version: "1.2.3" }, "package.json").add();
		execGit.commits();

		const result = await getCurrentVersion(config, logger, git, fileManager, config.files);
		expect(result).toStrictEqual({
			files: [
				{
					name: "package.json",
					path: relativeTo("package.json"),
					version: "1.2.3",
					isPrivate: true,
				},
			],
			version: "1.2.3",
		});
	});

	it("should determine the package is private", async () => {
		const { config, create, execGit, git, logger, relativeTo } = await setupTest(
			"version getCurrentVersion",
		);
		const fileManager = new FileManager(config, logger);

		create.json({ version: "1.2.3", private: true }, "package.json").add();
		execGit.commits();

		const result = await getCurrentVersion(config, logger, git, fileManager, config.files);
		expect(result).toStrictEqual({
			files: [
				{
					name: "package.json",
					path: relativeTo("package.json"),
					version: "1.2.3",
					isPrivate: true,
				},
			],
			version: "1.2.3",
		});
	});

	it("should be able to read package-lock.json", async () => {
		const { config, create, execGit, git, logger, relativeTo } = await setupTest(
			"version getCurrentVersion",
		);
		const fileManager = new FileManager(config, logger);

		create.json({ version: "1.2.3" }, "package.json").add();
		create
			.json(
				{
					version: "1.2.3",
					lockfileVersion: 2,
					packages: { "": { version: "1.2.3" } },
				},
				"package-lock.json",
			)
			.add();
		execGit.commits();

		const result = await getCurrentVersion(config, logger, git, fileManager, config.files);
		expect(result).toStrictEqual({
			files: [
				{
					name: "package.json",
					path: relativeTo("package.json"),
					version: "1.2.3",
					isPrivate: true,
				},
				{
					name: "package-lock.json",
					path: relativeTo("package-lock.json"),
					version: "1.2.3",
					isPrivate: true,
				},
			],
			version: "1.2.3",
		});
	});

	it("should fallback and get the latest tag from git", async () => {
		const { config, git, logger } = await setupTest("version getCurrentVersion");
		const fileManager = new FileManager(config, logger);

		await git.commit("--allow-empty", "-m", "test: a commit");
		await git.tag("v1.2.3", "-m", "chore: release 1.2.3");

		await expect(getCurrentVersion(config, logger, git, fileManager, config.files)).rejects.toThrow(
			"Unable to find current version",
		);

		config.gitTagFallback = true;

		const taggedResult = await getCurrentVersion(config, logger, git, fileManager, config.files);
		expect(taggedResult).toStrictEqual({
			files: [],
			version: "1.2.3",
		});
	});

	it("should throw an error if multiple versions found and not allowing multiple versions", async () => {
		const { config, create, execGit, git, logger } = await setupTest("version getCurrentVersion");
		const fileManager = new FileManager(config, logger);
		config.allowMultipleVersions = false;

		create.json({ version: "1.2.3" }, "package.json").add();
		create.json({ version: "3.2.1" }, "package-lock.json").add();
		execGit.commits();

		await expect(getCurrentVersion(config, logger, git, fileManager, config.files)).rejects.toThrow(
			"Found multiple versions",
		);
	});

	it("should throw an error if no version found", async () => {
		const { config, git, logger } = await setupTest("getCurrentVersion");
		const fileManager = new FileManager(config, logger);

		await expect(getCurrentVersion(config, logger, git, fileManager, config.files)).rejects.toThrow(
			"Unable to find current version",
		);
	});

	it("should take the latest version if multiple found", async () => {
		const { config, create, execGit, git, logger } = await setupTest("getCurrentVersion");
		const fileManager = new FileManager(config, logger);

		create.json({ version: "1.2.3" }, "package.json").add();
		create.json({ version: "3.2.1" }, "package-lock.json").add();
		execGit.commits();

		const result = await getCurrentVersion(config, logger, git, fileManager, config.files);
		expect(result.files.map((f) => f.version)).toStrictEqual(["1.2.3", "3.2.1"]);
		expect(result.version).toStrictEqual("3.2.1");
	});

	it("should be able to define the current version using the config", async () => {
		const { config, create, execGit, git, logger, relativeTo } = await setupTest(
			"version getCurrentVersion",
		);
		config.currentVersion = "3.2.1";
		const fileManager = new FileManager(config, logger);

		create.json({ version: "1.2.3" }, "package.json").add();
		execGit.commits();

		const result = await getCurrentVersion(config, logger, git, fileManager, config.files);
		expect(result).toStrictEqual({
			files: [
				{
					name: "package.json",
					path: relativeTo("package.json"),
					version: "1.2.3",
					isPrivate: true,
				},
			],
			version: "3.2.1",
		});
	});

	it("should log the version and exit if inspectVersion set", async () => {
		const spyOnConsole = vi.spyOn(console, "log").mockImplementation(() => undefined);
		const spyOnProcess = vi.spyOn(process, "exit").mockImplementation(() => undefined as never);

		const { config, create, execGit, git, logger } = await setupTest("version getCurrentVersion");
		config.inspectVersion = true;
		const fileManager = new FileManager(config, logger);

		create.json({ version: "1.2.3" }, "package.json").add();
		execGit.commits();

		await getCurrentVersion(config, logger, git, fileManager, config.files);
		expect(spyOnConsole).toHaveBeenCalledWith("1.2.3");
		expect(spyOnProcess).toHaveBeenCalledWith(0);

		spyOnConsole.mockRestore();
		spyOnProcess.mockRestore();
	});

	it("should ignore git ignored files", async () => {
		const { config, create, execGit, git, logger, relativeTo } = await setupTest(
			"version getCurrentVersion",
		);
		config.files = ["package.json", "ignored.json"];

		const fileManager = new FileManager(config, logger);

		create.json({ version: "1.2.3" }, "package.json").add();
		create.json({ version: "3.2.1" }, "ignored.json");
		create.file("ignored.json", ".gitignore").add();
		execGit.commits();

		const result = await getCurrentVersion(config, logger, git, fileManager, config.files);
		expect(result).toStrictEqual({
			files: [
				{
					isPrivate: true,
					name: "package.json",
					path: relativeTo("package.json"),
					version: "1.2.3",
				},
			],
			version: "1.2.3",
		});
	});
});

describe("version > getNextVersion", () => {
	it("should recommend a patch bump when no commits found", async () => {
		const { config, logger } = await setupTest("version getNextVersion");

		const result = await getNextVersion(config, logger, [], "1.2.3");
		expect(result).toStrictEqual({
			version: "1.2.4",
			releaseType: "patch",
			preMajor: false,
			changes: {
				major: 0,
				minor: 0,
				patch: 0,
			},
		});
	});

	it("should recommend a patch bump", async () => {
		const { config, logger } = await setupTest("version getNextVersion");

		const commit = {
			type: "fix",
			breakingChange: "",
			notes: [],
		} as unknown as Commit;

		const result = await getNextVersion(config, logger, [commit], "1.2.3");
		expect(result).toStrictEqual({
			version: "1.2.4",
			releaseType: "patch",
			preMajor: false,
			changes: {
				major: 0,
				minor: 0,
				patch: 1,
			},
		});
	});

	it("should recommend a minor bump", async () => {
		const { config, logger } = await setupTest("version getNextVersion");

		const commit = {
			type: "feat",
			breakingChange: "",
			notes: [],
		} as unknown as Commit;

		const result = await getNextVersion(config, logger, [commit], "1.2.3");
		expect(result).toStrictEqual({
			version: "1.3.0",
			releaseType: "minor",
			preMajor: false,
			changes: {
				major: 0,
				minor: 1,
				patch: 0,
			},
		});
	});

	it("should recommend a major bump", async () => {
		const { config, logger } = await setupTest("version getNextVersion");

		const commit = {
			type: "feat",
			breakingChange: "!",
			notes: [],
		} as unknown as Commit;

		const result = await getNextVersion(config, logger, [commit], "1.2.3");
		expect(result).toStrictEqual({
			version: "2.0.0",
			releaseType: "major",
			preMajor: false,
			changes: {
				major: 1,
				minor: 0,
				patch: 0,
			},
		});
	});

	it("should recommend a major bump from notes", async () => {
		const { config, logger } = await setupTest("version getNextVersion");

		const commit = {
			type: "feat",
			breakingChange: "",
			notes: [
				{
					title: "BREAKING CHANGE",
					text: "A breaking change",
				},
			],
		} as unknown as Commit;

		const result = await getNextVersion(config, logger, [commit], "1.2.3");
		expect(result).toStrictEqual({
			version: "2.0.0",
			releaseType: "major",
			preMajor: false,
			changes: {
				major: 1,
				minor: 0,
				patch: 0,
			},
		});
	});

	it("should recommend a pre-major patch bump", async () => {
		const { config, logger } = await setupTest("version getNextVersion");

		const commit = {
			type: "feat",
			breakingChange: "",
			notes: [],
		} as unknown as Commit;

		const result = await getNextVersion(config, logger, [commit], "0.1.0");
		expect(result).toStrictEqual({
			version: "0.1.1",
			releaseType: "patch",
			preMajor: true,
			changes: {
				major: 0,
				minor: 0,
				patch: 1,
			},
		});
	});

	it("should recommend a pre-major minor bump", async () => {
		const { config, logger } = await setupTest("version getNextVersion");

		const commit = {
			type: "feat",
			breakingChange: "!",
			notes: [],
		} as unknown as Commit;

		const result = await getNextVersion(config, logger, [commit], "0.1.0");
		expect(result).toStrictEqual({
			version: "0.2.0",
			releaseType: "minor",
			preMajor: true,
			changes: {
				major: 0,
				minor: 1,
				patch: 0,
			},
		});
	});

	it("should recommend a pre-major minor bump from notes", async () => {
		const { config, logger } = await setupTest("version getNextVersion");

		const commit = {
			type: "feat",
			breakingChange: "",
			notes: [
				{
					title: "BREAKING CHANGE",
					text: "A breaking change",
				},
			],
		} as unknown as Commit;

		const result = await getNextVersion(config, logger, [commit], "0.1.0");
		expect(result).toStrictEqual({
			version: "0.2.0",
			releaseType: "minor",
			preMajor: true,
			changes: {
				major: 0,
				minor: 1,
				patch: 0,
			},
		});
	});

	it('should be able to set "releaseAs" as a patch bump', async () => {
		const { config, logger } = await setupTest("version getNextVersion");
		config.releaseAs = "patch";

		const result = await getNextVersion(config, logger, [], "1.2.3");
		expect(result).toStrictEqual({
			version: "1.2.4",
			releaseType: "patch",
			preMajor: false,
			changes: {
				major: 0,
				minor: 0,
				patch: 0,
			},
		});
	});

	it('should be able to set "releaseAs" as a minor bump', async () => {
		const { config, logger } = await setupTest("version getNextVersion");
		config.releaseAs = "minor";

		const result = await getNextVersion(config, logger, [], "1.2.3");
		expect(result).toStrictEqual({
			version: "1.3.0",
			releaseType: "minor",
			preMajor: false,
			changes: {
				major: 0,
				minor: 0,
				patch: 0,
			},
		});
	});

	it('should be able to set "releaseAs" as a major bump', async () => {
		const { config, logger } = await setupTest("version getNextVersion");
		config.releaseAs = "major";

		const result = await getNextVersion(config, logger, [], "1.2.3");
		expect(result).toStrictEqual({
			version: "2.0.0",
			releaseType: "major",
			preMajor: false,
			changes: {
				major: 0,
				minor: 0,
				patch: 0,
			},
		});
	});

	it('should be able to set "releaseAs" and "preRelease" to create an alpha release', async () => {
		const { config, logger } = await setupTest("version getNextVersion");
		config.releaseAs = "major";
		config.preRelease = "alpha";

		const result = await getNextVersion(config, logger, [], "1.2.3");
		expect(result).toStrictEqual({
			version: "2.0.0-alpha.0",
			releaseType: "premajor",
			preMajor: false,
			changes: {
				major: 0,
				minor: 0,
				patch: 0,
			},
		});

		const result2 = await getNextVersion(config, logger, [], "2.0.0-alpha.0");
		expect(result2).toStrictEqual({
			version: "2.0.0-alpha.1",
			releaseType: "prerelease",
			preMajor: false,
			changes: {
				major: 0,
				minor: 0,
				patch: 0,
			},
		});
	});

	it("should skip version bump", async () => {
		const { config, logger } = await setupTest("version getNextVersion");
		config.skipBump = true;

		const result = await getNextVersion(config, logger, [], "1.2.3");
		expect(result).toStrictEqual({ version: "1.2.3" });
	});

	it("should be able to define the next version using the config", async () => {
		const { config, logger } = await setupTest("version getNextVersion");
		config.nextVersion = "2.0.0";

		const result = await getNextVersion(config, logger, [], "1.2.3");
		expect(result).toStrictEqual({ version: "2.0.0" });
	});

	it("should throw an error if next version in config is invalid", async () => {
		const { config, logger } = await setupTest("version getNextVersion");
		config.nextVersion = "invalid";

		await expect(getNextVersion(config, logger, [], "1.2.3")).rejects.toThrow(
			"Invalid Version: invalid",
		);
	});

	it("should handle an invalid current version", async () => {
		const { config, logger } = await setupTest("version getNextVersion");

		await expect(getNextVersion(config, logger, [], "invalid")).rejects.toThrow(
			"Invalid Version: invalid",
		);
	});

	it("should handle capitalized feat commit types", async () => {
		const { config, logger } = await setupTest("version getNextVersion");

		const commit = {
			type: "Feat",
			breakingChange: "",
			notes: [],
		} as unknown as Commit;

		const result = await getNextVersion(config, logger, [commit], "1.2.3");
		expect(result).toStrictEqual({
			version: "1.3.0",
			releaseType: "minor",
			preMajor: false,
			changes: {
				major: 0,
				minor: 1,
				patch: 0,
			},
		});
	});
});
