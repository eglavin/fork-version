import { ZodError } from "zod";
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

	it("should default to the standard release message format", async () => {
		const { testFolder } = await setupTest("user-config");

		const config = await getUserConfig({
			input: [],
			flags: {
				path: testFolder,
			},
		});

		expect(config.releaseMessageFormat).toBe("chore(release): {{currentTag}}");
	});

	it("should append a releaseMessageSuffix to the releaseMessageFormat", async () => {
		const { testFolder } = await setupTest("user-config");

		const config = await getUserConfig({
			input: [],
			flags: {
				path: testFolder,
				releaseMessageSuffix: "[skip ci]",
			},
		});

		expect(config.releaseMessageFormat).toBe("chore(release): {{currentTag}} [skip ci]");
	});

	it("should prefer a releaseMessageFormat and releaseMessageSuffix from CLI args over the config file", async () => {
		const { testFolder, create } = await setupTest("user-config");

		create.json(
			{
				releaseMessageFormat: "release: {{currentTag}}",
				releaseMessageSuffix: "[from config file]",
			},
			"fork.config.json",
		);
		const config = await getUserConfig({
			input: [],
			flags: {
				path: testFolder,
				releaseMessageFormat: "chore(release): {{currentTag}}",
				releaseMessageSuffix: "[from cli]",
			},
		});

		expect(config.releaseMessageFormat).toBe("chore(release): {{currentTag}} [from cli]");
	});

	it("should not change the default types when changelogAll is not set", async () => {
		const { testFolder } = await setupTest("user-config");

		const config = await getUserConfig({
			input: [],
			flags: {
				path: testFolder,
			},
		});

		expect(config.types).toStrictEqual([
			{ type: "feat", section: "Features" },
			{ type: "fix", section: "Bug Fixes" },
			{ type: "chore", hidden: true },
			{ type: "docs", hidden: true },
			{ type: "style", hidden: true },
			{ type: "refactor", hidden: true },
			{ type: "perf", hidden: true },
			{ type: "test", hidden: true },
		]);
	});

	it("should reveal hidden types under 'Other Changes' when changelogAll is set", async () => {
		const { testFolder } = await setupTest("user-config");

		const config = await getUserConfig({
			input: [],
			flags: {
				path: testFolder,
				changelogAll: true,
			},
		});

		expect(config.types).toStrictEqual([
			{ type: "feat", section: "Features" },
			{ type: "fix", section: "Bug Fixes" },
			{ type: "chore", section: "Other Changes", hidden: false },
			{ type: "docs", section: "Other Changes", hidden: false },
			{ type: "style", section: "Other Changes", hidden: false },
			{ type: "refactor", section: "Other Changes", hidden: false },
			{ type: "perf", section: "Other Changes", hidden: false },
			{ type: "test", section: "Other Changes", hidden: false },
		]);
	});

	it("should be able to override the default types via a config file", async () => {
		const { testFolder, create } = await setupTest("user-config");

		create.json(
			{
				types: [{ type: "feat", section: "New Features" }],
			},
			"fork.config.json",
		);
		const config = await getUserConfig({
			input: [],
			flags: {
				path: testFolder,
			},
		});

		expect(config.types).toStrictEqual([{ type: "feat", section: "New Features" }]);
	});

	describe("legacy config compatibility", () => {
		it("should map a legacy changelogPresetConfig from a config file onto its new options", async () => {
			const { testFolder, create } = await setupTest("user-config");
			const compatibilityWarnings: string[] = [];

			create.json(
				{
					changelogPresetConfig: {
						types: [{ type: "feat", section: "New Features" }],
						issuePrefixes: ["#", "gh-"],
					},
				},
				"fork.config.json",
			);
			const config = await getUserConfig(
				{
					input: [],
					flags: {
						path: testFolder,
					},
				},
				compatibilityWarnings,
			);

			expect(config.types).toStrictEqual([{ type: "feat", section: "New Features" }]);
			expect(config.commitParserOptions?.issuePrefixes).toStrictEqual(["#", "gh-"]);
			expect(compatibilityWarnings).toHaveLength(2);
		});

		it("should map the legacy --release-commit-message-format flag onto releaseMessageFormat", async () => {
			const { testFolder } = await setupTest("user-config");
			const compatibilityWarnings: string[] = [];

			const config = await getUserConfig(
				{
					input: [],
					flags: {
						path: testFolder,
						releaseCommitMessageFormat: "release: {{currentTag}}",
					},
				},
				compatibilityWarnings,
			);

			expect(config.releaseMessageFormat).toBe("release: {{currentTag}}");
			expect(compatibilityWarnings).toContainEqual(
				expect.stringContaining("--release-commit-message-format"),
			);
		});

		it("should prefer --release-message-format when both the old and new flags are set", async () => {
			const { testFolder } = await setupTest("user-config");
			const compatibilityWarnings: string[] = [];

			const config = await getUserConfig(
				{
					input: [],
					flags: {
						path: testFolder,
						releaseCommitMessageFormat: "old: {{currentTag}}",
						releaseMessageFormat: "new: {{currentTag}}",
					},
				},
				compatibilityWarnings,
			);

			expect(config.releaseMessageFormat).toBe("new: {{currentTag}}");
			expect(compatibilityWarnings).toContainEqual(expect.stringContaining("is already set"));
		});

		it("should still map a legacy changelogPresetConfig when running an inspect command", async () => {
			const { testFolder, create } = await setupTest("user-config");
			const compatibilityWarnings: string[] = [];

			create.json(
				{ changelogPresetConfig: { types: [{ type: "feat", section: "New Features" }] } },
				"fork.config.json",
			);
			const config = await getUserConfig(
				{
					input: ["inspect-version"],
					flags: {
						path: testFolder,
					},
				},
				compatibilityWarnings,
			);

			// getUserConfig always collects compatibility warnings regardless of command - it's up to
			// the caller (see `src/cli.ts`) to decide which commands are worth showing them for.
			expect(config.types).toStrictEqual([{ type: "feat", section: "New Features" }]);
			expect(compatibilityWarnings).toHaveLength(1);
		});
	});

	describe("resolved config validation", () => {
		it("accepts a fully-populated valid config", async () => {
			const { testFolder } = await setupTest("user-config");

			await expect(
				getUserConfig({ input: [], flags: { path: testFolder, releaseAs: "minor" } }),
			).resolves.toMatchObject({ releaseAs: "minor" });
		});

		it("rejects an invalid value that only reaches the config via a CLI flag", async () => {
			const { testFolder } = await setupTest("user-config");

			let caught: unknown;
			try {
				await getUserConfig({
					input: [],
					flags: { path: testFolder, releaseAs: "bogus" as "major" },
				});
			} catch (error) {
				caught = error;
			}

			expect(caught).toBeInstanceOf(Error);
			expect((caught as Error).message).toBe("Invalid resolved configuration");
			expect((caught as Error).cause).toBeInstanceOf(ZodError);
			expect((caught as { cause: ZodError }).cause.issues[0].path).toContain("releaseAs");
		});
	});
});
