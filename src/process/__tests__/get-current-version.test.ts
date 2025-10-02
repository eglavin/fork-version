import { setupTest } from "../../../tests/setup-tests";
import { getCurrentVersion } from "../get-current-version";
import { FileManager } from "../../files/file-manager";

describe("getCurrentVersion", () => {
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
