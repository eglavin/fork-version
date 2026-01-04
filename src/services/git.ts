import { execFile } from "node:child_process";
import semver from "semver";
import type { ForkConfig } from "../config/types";

export class Git {
	constructor(private config: Pick<ForkConfig, "path" | "dryRun">) {
		this.add = this.add.bind(this);
		this.commit = this.commit.bind(this);
		this.tag = this.tag.bind(this);
		this.log = this.log.bind(this);
		this.isIgnored = this.isIgnored.bind(this);
		this.getBranchName = this.getBranchName.bind(this);
		this.getRemoteUrl = this.getRemoteUrl.bind(this);
		this.getTags = this.getTags.bind(this);
		this.getMostRecentTag = this.getMostRecentTag.bind(this);
		this.getCleanedTags = this.getCleanedTags.bind(this);
		this.getHighestSemverVersionFromTags = this.getHighestSemverVersionFromTags.bind(this);
		this.getCommits = this.getCommits.bind(this);
	}

	async #execGit(command: string, args: string[]): Promise<string> {
		return new Promise((onResolve, onReject) => {
			execFile(
				"git",
				[command, ...args],
				{
					cwd: this.config.path,
					maxBuffer: Infinity,
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
	}

	/**
	 * Add file contents to the index
	 *
	 * [git-add Documentation](https://git-scm.com/docs/git-add)
	 *
	 * @example
	 * ```ts
	 * await git.add("CHANGELOG.md");
	 * ```
	 */
	async add(...args: (string | undefined)[]): Promise<string> {
		if (this.config.dryRun) {
			return "";
		}

		return this.#execGit("add", args.filter(Boolean) as string[]);
	}

	/**
	 * Record changes to the repository
	 *
	 * [git-commit Documentation](https://git-scm.com/docs/git-commit)
	 *
	 * @example
	 * ```ts
	 * await git.commit("--message", "chore(release): 1.2.3");
	 * ```
	 */
	async commit(...args: (string | undefined)[]): Promise<string> {
		if (this.config.dryRun) {
			return "";
		}

		return this.#execGit("commit", args.filter(Boolean) as string[]);
	}

	/**
	 * Create, list, delete or verify a tag object
	 *
	 * [git-tag Documentation](https://git-scm.com/docs/git-tag)
	 *
	 * @example
	 * ```ts
	 * await git.tag("--annotate", "v1.2.3", "--message", "chore(release): 1.2.3");
	 * ```
	 */
	async tag(...args: (string | undefined)[]): Promise<string> {
		if (this.config.dryRun) {
			return "";
		}

		return this.#execGit("tag", args.filter(Boolean) as string[]);
	}

	/**
	 * Show commit logs
	 *
	 * - [git-log Documentation](https://git-scm.com/docs/git-log)
	 * - [pretty-formats Documentation](https://git-scm.com/docs/pretty-formats)
	 *
	 * @example
	 * ```ts
	 * await git.log("--oneline");
	 * ```
	 */
	async log(...args: (string | undefined)[]): Promise<string> {
		try {
			return await this.#execGit("log", args.filter(Boolean) as string[]);
		} catch {
			return "";
		}
	}

	/**
	 * Check if a file is ignored by git
	 *
	 * [git-check-ignore Documentation](https://git-scm.com/docs/git-check-ignore)
	 *
	 * @example
	 * ```ts
	 * await git.isIgnored("src/my-file.txt");
	 * ```
	 */
	async isIgnored(file: string): Promise<boolean> {
		try {
			await this.#execGit("check-ignore", ["--no-index", file]);

			return true;
		} catch (_error) {
			return false;
		}
	}

	/**
	 * Get the name of the current branch
	 *
	 * [git-rev-parse Documentation](https://git-scm.com/docs/git-rev-parse)
	 *
	 * @example
	 * ```ts
	 * await git.getBranchName(); // "main"
	 * ```
	 */
	async getBranchName(): Promise<string> {
		try {
			const branchName = await this.#execGit("rev-parse", ["--abbrev-ref", "HEAD"]);

			return branchName.trim();
		} catch {
			return "";
		}
	}

	/**
	 * Get the URL of the remote repository
	 *
	 * [git-config Documentation](https://git-scm.com/docs/git-config)
	 *
	 * @example
	 * ```ts
	 * await git.getRemoteUrl(); // "https://github.com/eglavin/fork-version"
	 * ```
	 */
	async getRemoteUrl(): Promise<string> {
		try {
			const remoteUrl = await this.#execGit("config", ["--get", "remote.origin.url"]);

			return remoteUrl.trim();
		} catch (_error) {
			return "";
		}
	}

	/**
	 * `getTags` returns valid semver version tags in order of the commit history
	 *
	 * Using `git log` to get the commit history, we then parse the tags from the
	 * commit details which is expected to be in the following format:
	 * ```txt
	 * commit 3841b1d05750d42197fe958e3d8e06df378a842d (HEAD -> main, tag: v1.0.2, tag: v1.0.1, tag: v1.0.0)
	 * Author: Username <username@example.com>
	 * Date:   Sat Nov 9 15:00:00 2024 +0000
	 *
	 *     chore(release): v1.0.0
	 * ```
	 *
	 * - [Functionality extracted from the conventional-changelog - git-semver-tags project](https://github.com/conventional-changelog/conventional-changelog/blob/fac8045242099c016f5f3905e54e02b7d466bd7b/packages/git-semver-tags/index.js)
	 * - [conventional-changelog git-semver-tags MIT Licence](https://github.com/conventional-changelog/conventional-changelog/blob/fac8045242099c016f5f3905e54e02b7d466bd7b/packages/git-semver-tags/LICENSE.md)
	 *
	 * @example
	 * ```ts
	 * await git.getTags("v"); // ["v1.0.2", "v1.0.1", "v1.0.0"]
	 * ```
	 */
	async getTags(tagPrefix: string | undefined): Promise<string[]> {
		const logOutput = await this.log("--decorate", "--no-color", "--date-order");

		/**
		 * Search for tags in the following formats:
		 * @example "tag: 1.2.3," or "tag: 1.2.3)"
		 */
		const TAG_REGEX = /tag:\s*(?<tag>.+?)[,)]/gi;
		const tags: string[] = [];

		let tagMatch: RegExpExecArray | null = null;
		while ((tagMatch = TAG_REGEX.exec(logOutput))) {
			const { tag = "" } = tagMatch.groups ?? {};

			if (tagPrefix) {
				if (tag.startsWith(tagPrefix)) {
					const tagWithoutPrefix = tag.replace(new RegExp(`^${tagPrefix}`), "");
					if (semver.valid(tagWithoutPrefix)) {
						tags.push(tag);
					}
				}
			}
			// If no tagPrefix is provided, only include tags that start with a digit and are valid semver
			else if (/^\d/.test(tag) && semver.valid(tag)) {
				tags.push(tag);
			}
		}

		return tags;
	}

	/**
	 * Returns the latest git tag based on commit date
	 *
	 * @example
	 * ```ts
	 * await git.getMostRecentTag("v"); // "1.2.3"
	 * ```
	 */
	async getMostRecentTag(tagPrefix: string | undefined): Promise<string | undefined> {
		const tags = await this.getTags(tagPrefix);
		return tags[0] || undefined;
	}

	/**
	 * Get cleaned semver tags, with any tag prefix's removed
	 *
	 * @example
	 * ```ts
	 * await git.getCleanedTags("v"); // ["1.2.3", "1.2.2", "1.2.1"]
	 * ```
	 */
	async getCleanedTags(tagPrefix: string | undefined): Promise<string[]> {
		const tags = await this.getTags(tagPrefix);

		const cleanedTags = [];
		for (const tag of tags) {
			const tagWithoutPrefix = tag.replace(new RegExp(`^${tagPrefix}`), "");
			const cleanedTag = semver.clean(tagWithoutPrefix);
			if (cleanedTag) {
				cleanedTags.push(cleanedTag);
			}
		}

		return cleanedTags;
	}

	/**
	 * Get the highest semver version from git tags. This will return the highest
	 * semver version found for the given tag prefix, regardless of the commit date.
	 *
	 * @example
	 * ```ts
	 * await git.getHighestSemverVersionFromTags("v"); // "1.2.3"
	 * ```
	 */
	async getHighestSemverVersionFromTags(
		tagPrefix: string | undefined,
	): Promise<string | undefined> {
		const cleanedTags = await this.getCleanedTags(tagPrefix);
		return cleanedTags.sort(semver.rcompare)[0] || undefined;
	}

	/**
	 * Get commit history in a parsable format
	 *
	 * An array of strings with commit details is returned in the following format:
	 * ```txt
	 * subject
	 * body
	 * hash
	 * committer date
	 * committer name
	 * committer email
	 * ```
	 *
	 * @example
	 * ```ts
	 * await git.getCommits("v1.0.0", "HEAD", "src/utils");
	 * ```
	 */
	async getCommits(from = "", to = "HEAD", ...paths: string[]): Promise<string[]> {
		const SCISSOR = "^----------- FORK VERSION -----------^";

		const LOG_FORMAT = [
			"%s", // subject
			"%b", // body
			"%H", // hash
			"%d", // ref names
			"%cI", // committer date
			"%cN", // committer name
			"%cE", // committer email
			SCISSOR,
		].join("%n");

		const commits = await this.log(
			`--format=${LOG_FORMAT}`,
			[from, to].filter(Boolean).join(".."),
			paths.length ? "--" : "",
			...paths,
		);

		const splitCommits = commits.split(`\n${SCISSOR}\n`);

		if (splitCommits.length === 0) {
			return splitCommits;
		}

		if (splitCommits[0] === SCISSOR) {
			splitCommits.shift();
		}

		if (splitCommits[splitCommits.length - 1] === "") {
			splitCommits.pop();
		}

		return splitCommits;
	}
}
