import { CommitParser } from "../../commit-parser/commit-parser";
import { ChangelogWriter } from "../changelog-writer";
import type { Commit, CommitReference } from "../../commit-parser/types";
import type { RenderableCommit, RenderableNote } from "../types";
import type { CommitType } from "../../config/types";
import type { WriterOptions } from "../options";

const hash = "4ef2c86d393a9660aa9f753144256b1f200c16bd";
const date = "2024-12-22T17:36:50Z";
const name = "Fork Version";
const email = "fork-version@example.com";

const types: CommitType[] = [
	{ type: "feat", section: "Features" },
	{ type: "fix", section: "Bug Fixes" },
	{ type: "chore", hidden: true },
	{ type: "docs", hidden: true },
];

function commit(subject: string, body = "", commitHash = hash): Commit {
	const parser = new CommitParser();
	const raw = [subject, body, commitHash, "", date, name, email].join("\n");

	const parsed = parser.parse(raw);
	if (!parsed) throw new Error(`Failed to parse test commit: ${subject}`);
	return parsed;
}

function reference(overrides: Partial<CommitReference> = {}): CommitReference {
	return {
		prefix: "#",
		issue: "123",
		action: null,
		owner: null,
		repository: null,
		...overrides,
	};
}

function renderableCommit(overrides: Partial<RenderableCommit> = {}): RenderableCommit {
	return {
		groupTitle: false,
		scope: "",
		displaySubject: "a change",
		shortHash: "",
		commitUrl: undefined,
		references: [],
		...overrides,
	};
}

function renderableNote(overrides: Partial<RenderableNote> = {}): RenderableNote {
	return {
		title: "BREAKING CHANGES",
		scope: "",
		text: "a breaking change",
		...overrides,
	};
}

/**
 * `ChangelogWriter` expects any `{{host}}`/`{{owner}}`/`{{repository}}` placeholders to already
 * be resolved into the url formats (e.g. by `detect-git-host.ts`), so tests use fully resolved
 * formats here just like a detected GitHub remote would produce.
 */
function createPresetConfig(overrides?: Partial<WriterOptions>): WriterOptions {
	return {
		commitUrlFormat: "https://example.com/owner/repo/commit/{{hash}}",
		compareUrlFormat: "https://example.com/owner/repo/compare/{{previousTag}}...{{currentTag}}",
		issueUrlFormat: "https://example.com/owner/repo/issues/{{id}}",
		userUrlFormat: "https://example.com/{{user}}",
		...overrides,
	};
}

describe("changelog-writer", () => {
	describe("expandUrl", () => {
		it("replaces every placeholder it has a value for", () => {
			const writer = new ChangelogWriter(createPresetConfig(), types);

			expect(
				writer.expandUrl("{{host}}/{{owner}}/{{repository}}/commit/{{hash}}", {
					host: "https://example.com",
					owner: "eglavin",
					repository: "fork-version",
					hash: "abc1234",
				}),
			).toBe("https://example.com/eglavin/fork-version/commit/abc1234");
		});

		it("leaves a placeholder untouched when it has no value, or its value is undefined", () => {
			const writer = new ChangelogWriter(createPresetConfig(), types);

			expect(writer.expandUrl("{{host}}/commit/{{hash}}", { hash: "abc1234" })).toBe(
				"{{host}}/commit/abc1234",
			);
			expect(
				writer.expandUrl("{{host}}/commit/{{hash}}", { host: undefined, hash: "abc1234" }),
			).toBe("{{host}}/commit/abc1234");
		});

		it("inserts a value containing '$' patterns literally, instead of treating them as replacement patterns", () => {
			const writer = new ChangelogWriter(createPresetConfig(), types);

			expect(writer.expandUrl("compare/{{tag}}", { tag: "v1.0.0$&" })).toBe("compare/v1.0.0$&");
			expect(writer.expandUrl("compare/{{tag}}", { tag: "v1.0.0$$" })).toBe("compare/v1.0.0$$");
		});
	});

	describe("hasUnresolvedPlaceholder", () => {
		it("detects whether a placeholder remains", () => {
			const writer = new ChangelogWriter(createPresetConfig(), types);

			expect(writer.hasUnresolvedPlaceholder("{{host}}/owner/repo/commit/abc1234")).toBe(true);
			expect(writer.hasUnresolvedPlaceholder("https://example.com/owner/repo/commit/abc1234")).toBe(
				false,
			);
		});
	});

	describe("findTypeEntry", () => {
		it("finds the entry matching a commit's type, case-insensitively", () => {
			const writer = new ChangelogWriter(createPresetConfig(), types);

			expect(writer.findCommitType(commit("feat: add new feature"))).toStrictEqual({
				type: "feat",
				section: "Features",
			});
			expect(writer.findCommitType(commit("Feat: add new feature"))).toStrictEqual({
				type: "feat",
				section: "Features",
			});
		});

		it("returns undefined when no configured type matches", () => {
			const writer = new ChangelogWriter(createPresetConfig(), types);

			expect(writer.findCommitType(commit("test: add a test"))).toBeUndefined();
		});

		it("only matches a scoped entry when the commit's scope matches too", () => {
			const writer = new ChangelogWriter(createPresetConfig(), [
				{ type: "feat", scope: "api", section: "API Features" },
			]);

			expect(writer.findCommitType(commit("feat(api): add endpoint"))).toStrictEqual({
				type: "feat",
				scope: "api",
				section: "API Features",
			});
			expect(writer.findCommitType(commit("feat(ui): add button"))).toBeUndefined();
		});

		it("only matches an entry configured with an empty scope when the commit itself has no scope", () => {
			const writer = new ChangelogWriter(createPresetConfig(), [
				{ type: "feat", scope: "", section: "Core Features" },
			]);

			expect(writer.findCommitType(commit("feat: add new feature"))).toStrictEqual({
				type: "feat",
				scope: "",
				section: "Core Features",
			});
			expect(writer.findCommitType(commit("feat(api): add endpoint"))).toBeUndefined();
		});

		it("matches revert commits against a configured 'revert' entry", () => {
			const writer = new ChangelogWriter(createPresetConfig(), [
				{ type: "revert", section: "Reverts" },
			]);
			const revertCommit = commit('Revert "feat: add new feature"', `This reverts commit ${hash}.`);

			expect(writer.findCommitType(revertCommit)).toStrictEqual({
				type: "revert",
				section: "Reverts",
			});
		});
	});

	describe("resolveSubjectUrls", () => {
		it("links an inline issue reference when the issue url resolves, and always records it in seenIssues", () => {
			const writer = new ChangelogWriter(createPresetConfig(), types);
			const seenIssues = new Set<string>();

			expect(writer.resolveSubjectUrls("fix #123", seenIssues)).toBe(
				"fix [#123](https://example.com/owner/repo/issues/123)",
			);
			expect(seenIssues.has("#123")).toBe(true);

			const unresolvedWriter = new ChangelogWriter(
				createPresetConfig({ issueUrlFormat: "{{host}}/{{owner}}/{{repository}}/issues/{{id}}" }),
				types,
			);
			const unresolvedSeenIssues = new Set<string>();

			expect(unresolvedWriter.resolveSubjectUrls("fix #123", unresolvedSeenIssues)).toBe(
				"fix #123",
			);
			expect(unresolvedSeenIssues.has("#123")).toBe(true);
		});

		it("links an @mention when the user url resolves, otherwise leaves it as plain text", () => {
			const writer = new ChangelogWriter(createPresetConfig(), types);

			expect(writer.resolveSubjectUrls("thanks @someuser", new Set())).toBe(
				"thanks [@someuser](https://example.com/someuser)",
			);

			const unresolvedWriter = new ChangelogWriter(
				createPresetConfig({ userUrlFormat: "{{host}}/{{user}}" }),
				types,
			);

			expect(unresolvedWriter.resolveSubjectUrls("thanks @someuser", new Set())).toBe(
				"thanks @someuser",
			);
		});

		it("skips team/org mentions, e.g. @org/team", () => {
			const writer = new ChangelogWriter(createPresetConfig(), types);

			expect(writer.resolveSubjectUrls("cc @org/team", new Set())).toBe("cc @org/team");
		});

		it("recognizes issue prefixes from the commit parser options, defaulting to '#' when none are given", () => {
			const writer = new ChangelogWriter(createPresetConfig(), types);
			expect(writer.resolveSubjectUrls("fix gh-123", new Set())).toBe("fix gh-123");

			const githubWriter = new ChangelogWriter(createPresetConfig(), types, {
				issuePrefixes: ["#", "gh-"],
			});
			expect(githubWriter.resolveSubjectUrls("fix gh-123", new Set())).toBe(
				"fix [gh-123](https://example.com/owner/repo/issues/123)",
			);
		});

		it("links a cross-repository inline reference, interpolating its owner/repository into the issue url", () => {
			const writer = new ChangelogWriter(
				createPresetConfig({
					issueUrlFormat: "https://example.com/{{owner}}/{{repository}}/issues/{{id}}",
				}),
				types,
			);
			const seenIssues = new Set<string>();

			expect(writer.resolveSubjectUrls("fixes acme/other-repo#124", seenIssues)).toBe(
				"fixes [acme/other-repo#124](https://example.com/acme/other-repo/issues/124)",
			);
			expect(seenIssues.has("acme/other-repo#124")).toBe(true);
		});

		it("leaves an issue-like reference untouched when it doesn't end in a digit, matching the commit parser's own rules", () => {
			const writer = new ChangelogWriter(createPresetConfig(), types);

			expect(writer.resolveSubjectUrls("thanks #abc", new Set())).toBe("thanks #abc");
		});
	});

	describe("resolveCommitUrl", () => {
		it("returns undefined when there is no hash, or the commit url isn't fully resolved", () => {
			const writer = new ChangelogWriter(
				createPresetConfig({
					commitUrlFormat: "{{host}}/{{owner}}/{{repository}}/commit/{{hash}}",
				}),
				types,
			);

			expect(writer.resolveCommitUrl("")).toBeUndefined();
			expect(writer.resolveCommitUrl(hash)).toBeUndefined();
		});

		it("resolves a commit url from the configured format", () => {
			const writer = new ChangelogWriter(createPresetConfig(), types);

			expect(writer.resolveCommitUrl(hash)).toBe(`https://example.com/owner/repo/commit/${hash}`);
		});
	});

	describe("resolveReference", () => {
		it("builds a label, showing an owner/repository only for cross-repository references", () => {
			const writer = new ChangelogWriter(createPresetConfig(), types);

			expect(writer.resolveReference(reference())).toStrictEqual({
				label: "#123",
				url: "https://example.com/owner/repo/issues/123",
			});
			expect(
				writer.resolveReference(reference({ owner: "other-owner", repository: "other-repo" })),
			).toStrictEqual({
				label: "other-owner/other-repo#123",
				url: "https://example.com/owner/repo/issues/123",
			});
		});

		it("substitutes the reference's own owner/repository into the issue url when the format needs them", () => {
			const writer = new ChangelogWriter(
				createPresetConfig({
					issueUrlFormat: "https://example.com/{{owner}}/{{repository}}/issues/{{id}}",
				}),
				types,
			);

			expect(
				writer.resolveReference(reference({ owner: "other-owner", repository: "other-repo" })),
			).toStrictEqual({
				label: "other-owner/other-repo#123",
				url: "https://example.com/other-owner/other-repo/issues/123",
			});
		});

		it("returns url undefined when the issue url isn't fully resolved, keeping the label", () => {
			const writer = new ChangelogWriter(
				createPresetConfig({ issueUrlFormat: "{{host}}/{{owner}}/{{repository}}/issues/{{id}}" }),
				types,
			);

			expect(writer.resolveReference(reference())).toStrictEqual({ label: "#123", url: undefined });
		});
	});

	describe("transformCommits", () => {
		it("keeps a commit whose type is configured and assigns its section as the group title", () => {
			const writer = new ChangelogWriter(createPresetConfig(), types);
			const { commits } = writer.transformCommits([commit("feat: add new feature")]);

			expect(commits).toHaveLength(1);
			expect(commits[0].groupTitle).toBe("Features");
			expect(commits[0].displaySubject).toBe("add new feature");
		});

		it("discards a commit with no breaking change whose type is hidden or not configured at all", () => {
			const writer = new ChangelogWriter(createPresetConfig(), types);
			const { commits, notes } = writer.transformCommits([
				commit("chore: routine chore"),
				commit("test: add a test"),
			]);

			expect(commits).toHaveLength(0);
			expect(notes).toHaveLength(0);
		});

		it("groups a hidden type's breaking change commit into an 'Other Changes' section, regardless of scope", () => {
			const writer = new ChangelogWriter(createPresetConfig(), types);

			const scoped = writer.transformCommits([commit("chore(deps)!: bump deps")]);
			expect(scoped.commits[0].groupTitle).toBe("Other Changes");
			expect(scoped.notes).toStrictEqual([
				{ title: "BREAKING CHANGES", scope: "deps", text: "bump deps" },
			]);

			const unscoped = writer.transformCommits([commit("chore!: bump deps")]);
			expect(unscoped.commits[0].groupTitle).toBe("Other Changes");
		});

		it("groups a commit whose type doesn't match any configured entry into an 'Other Changes' section", () => {
			const writer = new ChangelogWriter(createPresetConfig(), types);
			const { commits } = writer.transformCommits([commit("obscure!: something weird")]);

			expect(commits).toHaveLength(1);
			expect(commits[0].groupTitle).toBe("Other Changes");
		});

		it("uses an explicit BREAKING CHANGE footer instead of deriving a note from the bang marker", () => {
			const writer = new ChangelogWriter(createPresetConfig(), types);
			const { notes } = writer.transformCommits([
				commit("feat!: a breaking feature", "BREAKING CHANGE: explicit reason"),
			]);

			expect(notes).toStrictEqual([
				{ title: "BREAKING CHANGES", scope: "", text: "explicit reason" },
			]);
		});

		it("excludes a footer reference already linked inline in the subject, but keeps the rest", () => {
			const writer = new ChangelogWriter(createPresetConfig(), types);
			const { commits } = writer.transformCommits([
				commit("fix: resolve #124", "fixes #124\nfixes #125"),
			]);

			expect(commits[0].displaySubject).toBe(
				"resolve [#124](https://example.com/owner/repo/issues/124)",
			);
			expect(commits[0].references).toStrictEqual([
				{ label: "#125", url: "https://example.com/owner/repo/issues/125" },
			]);
		});

		it("keeps a footer reference to another repository even if it shares an issue number with an inline reference", () => {
			const writer = new ChangelogWriter(createPresetConfig(), types);
			const { commits } = writer.transformCommits([
				commit("fix: resolve #124", "fixes acme/other-repo#124"),
			]);

			expect(commits[0].displaySubject).toBe(
				"resolve [#124](https://example.com/owner/repo/issues/124)",
			);
			expect(commits[0].references).toStrictEqual([
				{ label: "acme/other-repo#124", url: "https://example.com/owner/repo/issues/124" },
			]);
		});

		it("excludes a footer reference to another repository when that exact reference was already linked inline in the subject", () => {
			const writer = new ChangelogWriter(createPresetConfig(), types);
			const { commits } = writer.transformCommits([
				commit("fix: resolve acme/other-repo#124", "fixes acme/other-repo#124\nfixes #125"),
			]);

			expect(commits[0].displaySubject).toBe(
				"resolve [acme/other-repo#124](https://example.com/owner/repo/issues/124)",
			);
			expect(commits[0].references).toStrictEqual([
				{ label: "#125", url: "https://example.com/owner/repo/issues/125" },
			]);
		});
	});

	describe("groupCommits", () => {
		it("groups commits and sorts groups using the order sections first appear in the configured types", () => {
			const writer = new ChangelogWriter(createPresetConfig(), types);
			const groups = writer.groupCommits([
				renderableCommit({ groupTitle: "Bug Fixes" }),
				renderableCommit({ groupTitle: "Features" }),
			]);

			// "Features" is configured before "Bug Fixes" in createPresetConfig's `types`, so this
			// also proves the groups are genuinely sorted, not just left in input order.
			expect(groups.map((group) => group.title)).toStrictEqual(["Features", "Bug Fixes"]);
		});

		it("orders a section by its first appearance in `types`, even when a later type shares it", () => {
			const writer = new ChangelogWriter(createPresetConfig(), [
				{ type: "feat", section: "Features" },
				{ type: "fix", section: "Bug Fixes" },
				{ type: "perf", section: "Features" },
			]);
			const groups = writer.groupCommits([
				renderableCommit({ groupTitle: "Bug Fixes" }),
				renderableCommit({ groupTitle: "Features" }),
			]);

			expect(groups.map((group) => group.title)).toStrictEqual(["Features", "Bug Fixes"]);
		});

		it("sorts an untitled/unmatched group before any titled group", () => {
			const writer = new ChangelogWriter(createPresetConfig(), types);
			const groups = writer.groupCommits([
				renderableCommit({ groupTitle: "Features" }),
				renderableCommit({ groupTitle: false }),
			]);

			expect(groups.map((group) => group.title)).toStrictEqual([false, "Features"]);
		});

		it("sorts the catch-all 'Other Changes' group after every configured section", () => {
			const writer = new ChangelogWriter(createPresetConfig(), types);
			const groups = writer.groupCommits([
				renderableCommit({ groupTitle: "Other Changes" }),
				renderableCommit({ groupTitle: "Bug Fixes" }),
				renderableCommit({ groupTitle: "Features" }),
			]);

			expect(groups.map((group) => group.title)).toStrictEqual([
				"Features",
				"Bug Fixes",
				"Other Changes",
			]);
		});

		it("sorts commits within a group by scope, then subject", () => {
			const writer = new ChangelogWriter(createPresetConfig(), types);
			const groups = writer.groupCommits([
				renderableCommit({ groupTitle: "Features", scope: "b", displaySubject: "second" }),
				renderableCommit({ groupTitle: "Features", scope: "a", displaySubject: "first" }),
			]);

			expect(groups[0].commits.map((commit) => commit.scope)).toStrictEqual(["a", "b"]);
		});

		it("sorts by scope first even when the concatenation of scope and subject would collide", () => {
			const writer = new ChangelogWriter(createPresetConfig(), types);
			const groups = writer.groupCommits([
				renderableCommit({ groupTitle: "Features", scope: "ab", displaySubject: "x" }),
				renderableCommit({ groupTitle: "Features", scope: "a", displaySubject: "bx" }),
			]);

			// Concatenated, both commits produce "abx", sorting on the concatenation would leave
			// them in input order instead of ordering by `scope` first.
			expect(groups[0].commits.map((commit) => commit.scope)).toStrictEqual(["a", "ab"]);
		});
	});

	describe("groupNotes", () => {
		it("groups notes by title", () => {
			const writer = new ChangelogWriter(createPresetConfig(), types);
			const groups = writer.groupNotes([
				renderableNote({ text: "first" }),
				renderableNote({ text: "second" }),
			]);

			expect(groups).toHaveLength(1);
			expect(groups[0].notes.map((note) => note.text)).toStrictEqual(["first", "second"]);
		});

		it("sorts groups alphabetically by title", () => {
			const writer = new ChangelogWriter(createPresetConfig(), types);
			const groups = writer.groupNotes([
				renderableNote({ title: "Z", text: "last" }),
				renderableNote({ title: "A", text: "first" }),
			]);

			expect(groups.map((group) => group.title)).toStrictEqual(["A", "Z"]);
		});
	});

	describe("generate", () => {
		it("should render a version heading without a compare link when there is no previous tag", () => {
			const output = new ChangelogWriter(createPresetConfig(), types).generate([], {
				version: "1.0.0",
				currentTag: "v1.0.0",
				date: "2024-01-01",
			});

			expect(output).toContain("## 1.0.0 (2024-01-01)");
			expect(output).not.toContain("[1.0.0]");
		});

		it("should render a version heading with a compare link when a previous tag is known", () => {
			const output = new ChangelogWriter(createPresetConfig(), types).generate([], {
				version: "1.1.0",
				previousTag: "v1.0.0",
				currentTag: "v1.1.0",
				date: "2024-01-01",
			});

			expect(output).toContain(
				"## [1.1.0](https://example.com/owner/repo/compare/v1.0.0...v1.1.0) (2024-01-01)",
			);
		});

		it("should render a plain version heading (no link) when the compare url isn't fully resolved", () => {
			const presetConfig = createPresetConfig({
				compareUrlFormat:
					"{{host}}/{{owner}}/{{repository}}/compare/{{previousTag}}...{{currentTag}}",
			});

			const output = new ChangelogWriter(presetConfig, types).generate([], {
				version: "1.1.0",
				previousTag: "v1.0.0",
				currentTag: "v1.1.0",
				date: "2024-01-01",
			});

			expect(output).toContain("## 1.1.0 (2024-01-01)");
			expect(output).not.toContain("{{host}}");
			expect(output).not.toContain("[1.1.0]");
		});

		it("should render a plain commit hash (no link) when the commit url isn't fully resolved", () => {
			const commits = [commit("feat: add new feature")];
			const presetConfig = createPresetConfig({
				commitUrlFormat: "{{host}}/{{owner}}/{{repository}}/commit/{{hash}}",
			});

			const output = new ChangelogWriter(presetConfig, types).generate(commits, {
				version: "1.1.0",
				currentTag: "v1.1.0",
				date: "2024-01-01",
			});

			expect(output).toContain(`* add new feature ${hash.substring(0, 7)}`);
			expect(output).not.toContain("{{host}}");
		});

		it("should render a plain issue reference (no link) when the issue url isn't fully resolved", () => {
			const commits = [commit("fix: a bug fix", "fixes #124")];
			const presetConfig = createPresetConfig({
				issueUrlFormat: "{{host}}/{{owner}}/{{repository}}/issues/{{id}}",
			});

			const output = new ChangelogWriter(presetConfig, types).generate(commits, {
				version: "1.1.0",
				currentTag: "v1.1.0",
				date: "2024-01-01",
			});

			expect(output).toContain(", closes #124");
			expect(output).not.toContain("{{host}}");
		});

		it("should group commits into sections and link commit hashes", () => {
			const commits = [
				commit("feat(scope): add new feature", "Closes #123"),
				commit("fix: a bug fix", "fixes #124"),
			];

			const output = new ChangelogWriter(createPresetConfig(), types).generate(commits, {
				version: "1.1.0",
				currentTag: "v1.1.0",
				date: "2024-01-01",
			});

			expect(output).toContain("### Features");
			expect(output).toContain(
				`* **scope:** add new feature ([${hash.substring(0, 7)}](https://example.com/owner/repo/commit/${hash})), closes [#123](https://example.com/owner/repo/issues/123)`,
			);
			expect(output).toContain("### Bug Fixes");
			expect(output).toContain(
				`* a bug fix ([${hash.substring(0, 7)}](https://example.com/owner/repo/commit/${hash})), closes [#124](https://example.com/owner/repo/issues/124)`,
			);
			// Features should be listed before Bug Fixes, matching the order in `types`.
			expect(output.indexOf("### Features")).toBeLessThan(output.indexOf("### Bug Fixes"));
		});

		it("should place a hidden type's breaking change commits into an 'Other Changes' section", () => {
			const commits = [commit("chore(deps)!: bump deps"), commit("docs!: rewrite the readme")];

			const output = new ChangelogWriter(createPresetConfig(), types).generate(commits, {
				version: "2.0.0",
				currentTag: "v2.0.0",
				date: "2024-01-01",
			});

			expect(output).toContain("### Other Changes");
			expect(output).toContain("* **deps:** bump deps");
			expect(output).toContain("* rewrite the readme");
			expect(output).not.toContain("### chore");
			expect(output).not.toContain("### docs");
		});

		it("should render breaking change footers as a BREAKING CHANGES section", () => {
			const commits = [
				commit("feat: initial commit", "BREAKING CHANGE: this is a breaking change"),
			];

			const output = new ChangelogWriter(createPresetConfig(), types).generate(commits, {
				version: "2.0.0",
				currentTag: "v2.0.0",
				date: "2024-01-01",
			});

			expect(output).toContain("### ⚠ BREAKING CHANGES");
			expect(output).toContain("* this is a breaking change");
		});

		it("should match snapshot", () => {
			const commits = [
				commit("feat: initial commit", "BREAKING CHANGE: this is a breaking change"),
				commit("refactor: adds functionality #1234", "closes #3344"),
				commit("chore: bump dependency"),
				commit("fix: resolves issue with the thing", "fixes #8899"),
				commit(
					"refactor: cleans up the new feature",
					"BREAKING-CHANGE: Another one bites the dust",
				),
				commit("test!: migrate tests to vitest"),
				commit("test(deps)!: removes old testing libraries"),
			];

			const output = new ChangelogWriter(createPresetConfig(), [
				{ type: "feat", section: "🔨 Features" },
				{ type: "fix", section: "⚙️ Bug Fixes" },
				{ type: "refactor", section: "✂️ Refactor" },
				{ type: "chore", section: "🧹 Chore" },
				{ type: "docs", section: "📕 Docs" },
				{ type: "style", section: "💅 Style" },
				{ type: "perf", section: "🏎️ Perf" },
				{ type: "test", hidden: true },
			]).generate(commits, {
				title: "big release",
				version: "2.0.0",
				previousTag: "v1.2.3",
				currentTag: "v2.0.0",
				date: "2024-01-01",
			});

			expect(output).toMatchInlineSnapshot(`
				"## [2.0.0](https://example.com/owner/repo/compare/v1.2.3...v2.0.0) "big release" (2024-01-01)

				### ⚠ BREAKING CHANGES

				* this is a breaking change
				* Another one bites the dust
				* migrate tests to vitest
				* **deps:** removes old testing libraries

				### 🔨 Features

				* initial commit ([4ef2c86](https://example.com/owner/repo/commit/4ef2c86d393a9660aa9f753144256b1f200c16bd))

				### ⚙️ Bug Fixes

				* resolves issue with the thing ([4ef2c86](https://example.com/owner/repo/commit/4ef2c86d393a9660aa9f753144256b1f200c16bd)), closes [#8899](https://example.com/owner/repo/issues/8899)

				### ✂️ Refactor

				* adds functionality [#1234](https://example.com/owner/repo/issues/1234) ([4ef2c86](https://example.com/owner/repo/commit/4ef2c86d393a9660aa9f753144256b1f200c16bd)), closes [#3344](https://example.com/owner/repo/issues/3344)
				* cleans up the new feature ([4ef2c86](https://example.com/owner/repo/commit/4ef2c86d393a9660aa9f753144256b1f200c16bd))

				### 🧹 Chore

				* bump dependency ([4ef2c86](https://example.com/owner/repo/commit/4ef2c86d393a9660aa9f753144256b1f200c16bd))

				### Other Changes

				* migrate tests to vitest ([4ef2c86](https://example.com/owner/repo/commit/4ef2c86d393a9660aa9f753144256b1f200c16bd))
				* **deps:** removes old testing libraries ([4ef2c86](https://example.com/owner/repo/commit/4ef2c86d393a9660aa9f753144256b1f200c16bd))
				"
			`);
		});
	});
});
