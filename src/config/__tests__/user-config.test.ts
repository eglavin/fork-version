import { setupTest } from "../../../tests/setup-tests";
import { getUserConfig } from "../user-config";

describe("user-config", () => {
	it("should have the default command set", async () => {
		const { testFolder } = await setupTest("load-config");

		const config = await getUserConfig({
			input: [],
			flags: {
				path: testFolder,
			},
		});

		expect(config).toBeDefined();
		expect(config.command).toBe("main");
		expect(config.silent).toBe(false);
	});

	it("should be able to set the command via cli args", async () => {
		const { testFolder } = await setupTest("load-config");

		const config = await getUserConfig({
			input: ["inspect-version"],
			flags: {
				path: testFolder,
			},
		});

		expect(config).toBeDefined();
		expect(config.command).toBe("inspect-version");
		expect(config.silent).toBe(true);
	});

	it("should be able to set the command via config file", async () => {
		const { testFolder, create } = await setupTest("user-config");

		create.json({ command: "inspect-version" }, "fork.config.json");
		const config = await getUserConfig({
			input: [],
			flags: {
				path: testFolder,
			},
		});

		expect(config).toBeDefined();
		expect(config.command).toBe("inspect-version");
	});

	it("should prefer cli args over config file", async () => {
		const { testFolder, create } = await setupTest("user-config");

		create.json({ command: "main" }, "fork.config.json");
		const config = await getUserConfig({
			input: ["inspect-version"],
			flags: {
				path: testFolder,
			},
		});

		expect(config).toBeDefined();
		expect(config.command).toBe("inspect-version");
	});

	it("should respect deprecated --inspect-version flag", async () => {
		const { testFolder, create } = await setupTest("user-config");

		create.json({ inspectVersion: true }, "fork.config.json");
		const config = await getUserConfig({
			input: ["inspect-tag"],
			flags: {
				path: testFolder,
			},
		});

		expect(config).toBeDefined();
		expect(config.command).toBe("inspect-version");
	});

	it("should be able to search for files using glob pattern", async () => {
		const { testFolder, create, relativeTo } = await setupTest("user-config");

		create.json({ glob: "**/*.txt" }, "fork.config.json");
		create.file("\n", "file1.txt");
		create.file("\n", "file2.txt");
		create.file("\n", "file3.md");
		create.directory("subdir");
		create.file("\n", "subdir", "file4.txt");
		create.directory("subdir", "subdir2", "subdir3");
		create.file("\n", "subdir", "subdir2", "subdir3", "file5.txt");

		const config = await getUserConfig({
			input: [],
			flags: {
				path: testFolder,
			},
		});

		expect(config.files).toStrictEqual([
			relativeTo("file1.txt"),
			relativeTo("file2.txt"),
			relativeTo("subdir", "file4.txt"),
			relativeTo("subdir", "subdir2", "subdir3", "file5.txt"),
		]);
	});

	it("should exclude node_modules and .git folders when using glob pattern", async () => {
		const { testFolder, create, relativeTo } = await setupTest("user-config");

		create.json({ glob: "**/*.txt" }, "fork.config.json");
		create.file("\n", "file1.txt");
		create.directory("node_modules");
		create.file("\n", "node_modules", "file2.txt");
		create.directory(".git");
		create.file("\n", ".git", "file6.txt");

		const config = await getUserConfig({
			input: [],
			flags: {
				path: testFolder,
				glob: "**/*.txt",
			},
		});

		expect(config.files).toStrictEqual([relativeTo("file1.txt")]);
	});

	it("should match multiple files", async () => {
		const { testFolder, create, relativeTo } = await setupTest("user-config");

		create.file("{}", "package.json");
		create.file("{}", "tsconfig.json");
		create.directory("UI");
		create.file("{}", "UI", "package.json");
		create.file("{}", "UI", "tsconfig.json");
		create.directory("API");
		create.file("\n", "API", "MyApi.csproj");

		const config = await getUserConfig({
			input: [],
			flags: {
				path: testFolder,
				glob: "**/{package.json,*.csproj}",
			},
		});

		expect(config.files).toStrictEqual([
			relativeTo("package.json"),
			relativeTo("UI", "package.json"),
			relativeTo("API", "MyApi.csproj"),
		]);
	});
});
