import { randomBytes } from "node:crypto";
import { join } from "node:path";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { type ExecSyncOptionsWithBufferEncoding, execFile, execSync } from "node:child_process";

import { getUserConfig } from "../src/config/user-config";
import { Logger } from "../src/services/logger";
import { Git } from "../src/services/git";

interface ISetupTestOptions {
	/**
	 * The name to use for the git user.
	 */
	userName: string;
	/**
	 * The email address to use for the git user.
	 */
	userEmail: string;
}

function createSetupTestOptions(options?: Partial<ISetupTestOptions>) {
	const defaultOptions: ISetupTestOptions = {
		userName: "Fork Version",
		userEmail: "fork-version@example.com",
	};

	// Override default options with user options.
	if (options?.userName != undefined) defaultOptions.userName = options.userName;
	if (options?.userEmail != undefined) defaultOptions.userEmail = options.userEmail;

	return defaultOptions;
}

/**
 * Setup a test environment with a test folder, config, logger and git instances.
 *
 * Tests live in the `fork-version.tests` folder, which is created in the parent directory of the fork-version repo.
 *
 * @example
 * ```js
 * const { config, create, logger, git } = await setupTest("execute-file");
 * ```
 */
export async function setupTest(testName: string, options?: Partial<ISetupTestOptions>) {
	const testFolderLocation = join(process.cwd(), "..", "fork-version.tests"); // Need to step up outside of the fork-version repo to avoid git conflicts.
	const testFolder = join(testFolderLocation, `${randomBytes(16).toString("hex")}-${testName}`);

	const { userName, userEmail } = createSetupTestOptions(options);

	const execSyncOptions: ExecSyncOptionsWithBufferEncoding = {
		cwd: testFolder,
		stdio: "ignore",
	};

	if (!existsSync(testFolder)) {
		mkdirSync(testFolder, { recursive: true });

		if (!existsSync(testFolder)) {
			throw new Error("Unable to create test folder.");
		}
	} else {
		throw new Error(`Test folder already exists: ${testFolder}`);
	}

	execSync("git init --initial-branch=main", execSyncOptions);
	execSync("git config commit.gpgSign false", execSyncOptions);
	execSync("git config core.autocrlf false", execSyncOptions);

	execSync(`git config user.name "${userName}"`, execSyncOptions);
	execSync(`git config user.email "${userEmail}"`, execSyncOptions);

	//#region Create default test config, logger and git instances
	const config = await getUserConfig({});
	config.path = testFolder;
	config.header = "# Test Header\n";
	config.changelogPresetConfig = {
		...config.changelogPresetConfig,
		types: [
			{ type: "feat", section: "Features" },
			{ type: "fix", section: "Bug Fixes" },
			{ type: "chore", section: "Chore" },
			{ type: "docs", section: "Docs" },
			{ type: "style", section: "Style" },
			{ type: "refactor", section: "Refactor" },
			{ type: "perf", section: "Perf" },
			{ type: "test", section: "Test" },
		],
	};
	config.gitTagFallback = false;

	const logger = new Logger({ silent: true, debug: false, inspectVersion: false });
	logger.log = vi.fn();
	logger.warn = vi.fn();
	logger.error = vi.fn();
	logger.debug = vi.fn();

	const git = new Git(config);
	//#endregion

	function returnHandler(path: string) {
		return {
			/**
			 * Track the newly created file.
			 * @example
			 * ```js
			 * create.file("Hello, World!", "src", "index.ts").add();
			 * ```
			 */
			add: function _add() {
				execSync(`git add "${path}"`, execSyncOptions);
			},
		};
	}

	return {
		testFolder,
		config,
		logger,
		git,

		/**
		 * Create a path relative to the test folder.
		 * @example
		 * ```js
		 * relativeTo("src", "components");
		 * ```
		 */
		relativeTo: function _relativeTo(...pathSegments: string[]) {
			return join(testFolder, ...pathSegments);
		},

		create: {
			/**
			 * Create a directory in the test folder.
			 * @example
			 * ```js
			 * create.directory("src", "components");
			 * ```
			 */
			directory: function _createDirectory(...directory: string[]) {
				const path = join(testFolder, ...directory);
				mkdirSync(path, { recursive: true });
			},
			/**
			 * Create a file in the test folder.
			 * @example
			 * ```js
			 * create.file("Hello, World!", "src", "index.ts");
			 * ```
			 */
			file: function _createFile(content: string, ...file: string[]) {
				const path = join(testFolder, ...file);
				writeFileSync(path, content, "utf-8");

				return returnHandler(path);
			},
			/**
			 * Create a JSON file in the test folder.
			 * @example
			 * ```js
			 * create.json({ key: "value" }, "src", "config.json");
			 * ```
			 */
			json: function _createJson(jsObject: object, ...file: string[]) {
				const path = join(testFolder, ...file);
				writeFileSync(path, JSON.stringify(jsObject, null, 2), "utf-8");

				return returnHandler(path);
			},
		},

		execGit: {
			/**
			 * Execute a git command in the test folder.
			 * @example
			 * ```js
			 * execGit.raw("status");
			 * ```
			 */
			raw: function _execGitRaw(command: string, ...args: string[]) {
				return new Promise<string>((onResolve, onReject) => {
					execFile(
						"git",
						[command, ...args],
						{
							cwd: config.path,
						},
						(error, stdout, stderr) => {
							if (error) {
								onReject(error);
							} else {
								onResolve(stdout ? stdout : stderr);
							}
						},
					);
				});
			},
			/**
			 * Create a git commit in the test folder.
			 * @example
			 * ```js
			 * execGit.commit("feat: A feature commit");
			 * execGit.commit("feat: A feature commit", "This is the body of the commit.");
			 * ```
			 */
			commit: function _execGitCommit(message: string, commitBody?: string) {
				execSync(
					commitBody
						? `git commit --allow-empty -m "${message}" -m "${commitBody}"`
						: `git commit --allow-empty -m "${message}"`,
					execSyncOptions,
				);
			},
			/**
			 * Create a series of commits in the test folder.
			 * @default
			 * ```js
			 * ["initial commit", "feat: A feature commit", "test: A test commit", "fix: A fix commit"]
			 * ```
			 * @example
			 * ```js
			 * execGit.commits();
			 * execGit.commits(["feat: A feature commit", "test: A test commit"]);
			 * ```
			 */
			commits: function _execGitCommits(
				commits: string[] = [
					"initial commit",
					"feat: A feature commit",
					"test: A test commit",
					"fix: A fix commit",
				],
			) {
				for (const message of commits) {
					this.commit(message);
				}
			},
			tag: function _execGitTag(tag: string, message: string) {
				execSync(`git tag --annotate "${tag}" --message "${message}"`, execSyncOptions);
			},
		},
	};
}
