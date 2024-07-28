import { createTestDir } from "../../../tests/create-test-directory";
import { getCurrentVersion, getNextVersion } from "../version";
import { FileManager } from "../../strategies/file-manager";

describe("version > getCurrentVersion", () => {
	it("should be able to read package.json", async () => {
		const { relativeTo, config, logger, createJSONFile, createCommits } = await createTestDir(
			"version getCurrentVersion",
		);
		const fileManager = new FileManager(config, logger);

		createJSONFile({ version: "1.2.3" });
		createCommits();

		const result = await getCurrentVersion(config, logger, fileManager, config.files);
		expect(result).toEqual({
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
		const { relativeTo, config, logger, createJSONFile, createCommits } = await createTestDir(
			"version getCurrentVersion",
		);
		const fileManager = new FileManager(config, logger);

		createJSONFile({ version: "1.2.3", private: true });
		createCommits();

		const result = await getCurrentVersion(config, logger, fileManager, config.files);
		expect(result).toEqual({
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
		const { relativeTo, config, logger, createJSONFile, createCommits } = await createTestDir(
			"version getCurrentVersion",
		);
		const fileManager = new FileManager(config, logger);

		createJSONFile({ version: "1.2.3" });
		createJSONFile(
			{
				version: "1.2.3",
				lockfileVersion: 2,
				packages: { "": { version: "1.2.3" } },
			},
			"package-lock.json",
		);
		createCommits();

		const result = await getCurrentVersion(config, logger, fileManager, config.files);
		expect(result).toEqual({
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

	it("should throw an error if multiple versions found and not allowing multiple versions", async () => {
		const { config, logger, createJSONFile, createCommits } = await createTestDir(
			"version getCurrentVersion",
		);
		const fileManager = new FileManager(config, logger);
		config.allowMultipleVersions = false;

		createJSONFile({ version: "1.2.3" });
		createJSONFile({ version: "3.2.1" }, "package-lock.json");
		createCommits();

		expect(getCurrentVersion(config, logger, fileManager, config.files)).rejects.toThrow(
			"Found multiple versions",
		);
	});

	it("should throw an error if no version found", async () => {
		const { config, logger } = await createTestDir("getCurrentVersion");
		const fileManager = new FileManager(config, logger);

		expect(getCurrentVersion(config, logger, fileManager, config.files)).rejects.toThrow(
			"Unable to find current version",
		);
	});

	it("should take the latest version if multiple found", async () => {
		const { config, logger, createJSONFile, createCommits } =
			await createTestDir("getCurrentVersion");
		const fileManager = new FileManager(config, logger);

		createJSONFile({ version: "1.2.3" });
		createJSONFile({ version: "3.2.1" }, "package-lock.json");
		createCommits();

		const result = await getCurrentVersion(config, logger, fileManager, config.files);
		expect(result.files.map((f) => f.version)).toEqual(["1.2.3", "3.2.1"]);
		expect(result.version).toEqual("3.2.1");
	});

	it("should be able to define the current version using the config", async () => {
		const { relativeTo, config, logger, createJSONFile, createCommits } = await createTestDir(
			"version getCurrentVersion",
		);
		config.currentVersion = "3.2.1";
		const fileManager = new FileManager(config, logger);

		createJSONFile({ version: "1.2.3" });
		createCommits();

		const result = await getCurrentVersion(config, logger, fileManager, config.files);
		expect(result).toEqual({
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

		const { config, logger, createJSONFile, createCommits } = await createTestDir(
			"version getCurrentVersion",
		);
		config.inspectVersion = true;
		const fileManager = new FileManager(config, logger);

		createJSONFile({ version: "1.2.3" });
		createCommits();

		await getCurrentVersion(config, logger, fileManager, config.files);
		expect(spyOnConsole).toHaveBeenCalledWith("1.2.3");
		expect(spyOnProcess).toHaveBeenCalledWith(0);

		spyOnConsole.mockRestore();
		spyOnProcess.mockRestore();
	});
});

describe("version > getNextVersion", () => {
	it("should determine the next version as a minor bump", async () => {
		const { config, logger, createJSONFile, createCommits } =
			await createTestDir("version getNextVersion");

		createJSONFile({ version: "1.2.3" });
		createCommits(["feat: A feature commit"]);

		const result = await getNextVersion(config, logger, "1.2.3");
		expect(result).toEqual({
			level: 1,
			preMajor: false,
			reason: "There are 0 BREAKING CHANGES and 1 features",
			releaseType: "minor",
			version: "1.3.0",
		});
	});

	it("should throw an error if not able to determine the next version", async () => {
		const { config, logger } = await createTestDir("version getNextVersion");

		expect(getNextVersion(config, logger, "1.2.3")).rejects.toThrow(
			"[conventional-recommended-bump] Unable to determine next version",
		);
	});

	it("should be able to define the next version using the config", async () => {
		const { config, logger, createJSONFile, createCommits } =
			await createTestDir("version getNextVersion");
		config.nextVersion = "2.0.0";

		createJSONFile({ version: "1.2.3" });
		createCommits(["feat: A feature commit"]);

		const result = await getNextVersion(config, logger, "1.2.3");
		expect(result).toEqual({ version: "2.0.0" });
	});

	it("should skip version bump", async () => {
		const { config, logger } = await createTestDir("version getNextVersion");
		config.skipBump = true;

		const result = await getNextVersion(config, logger, "1.2.3");
		expect(result).toEqual({ version: "1.2.3" });
	});

	it("should recommend a pre-major bump", async () => {
		const { config, logger, createCommits } = await createTestDir("version getNextVersion");

		createCommits(["feat: A feature commit"]);

		const result = await getNextVersion(config, logger, "0.1.0");
		expect(result).toEqual({
			level: 2,
			preMajor: true,
			reason: "There are 0 BREAKING CHANGES and 0 features",
			releaseType: "patch",
			version: "0.1.1",
		});
	});

	it("should recommend a patch bump", async () => {
		const { config, logger, createCommits } = await createTestDir("version getNextVersion");

		createCommits(["fix: A fix commit"]);

		const result = await getNextVersion(config, logger, "1.2.3");
		expect(result).toEqual({
			level: 2,
			preMajor: false,
			reason: "There are 0 BREAKING CHANGES and 0 features",
			releaseType: "patch",
			version: "1.2.4",
		});
	});

	it.only("should recommend a minor bump", async () => {
		const { config, logger, createCommits } = await createTestDir("version getNextVersion");

		createCommits(["feat: A feature commit"]);

		const result = await getNextVersion(config, logger, "1.2.3");
		expect(result).toEqual({
			level: 1,
			preMajor: false,
			reason: "There are 0 BREAKING CHANGES and 0 features",
			releaseType: "minor",
			version: "1.3.0",
		});
	});
});
