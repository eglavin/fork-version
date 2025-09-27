import type { MockInstance } from "vitest";
import { setupTest } from "../../../tests/setup-tests";
import { Git } from "../../utils/git";
import { Logger } from "../../utils/logger";
import { CommitParser } from "../commit-parser";
import { type Commit } from "../types";

const hash = "4ef2c86d393a9660aa9f753144256b1f200c16bd";
const date = "2024-12-22T17:36:50Z";
const name = "Fork Version";
const email = "fork-version@example.com";

function createCommit(subject: string, body = "\r\n\n") {
	return [subject, "\n" + body, hash, date, name, email].join("\n");
}

describe("commit-parser", () => {
	describe("general", () => {
		it("should parse raw commit", () => {
			const parser = new CommitParser();

			const commits = [
				createCommit(
					"refactor: this is a long commit message with a lot of content in it which I'm wondering how it would be handled by the commit log parsing system so we'll see what happens.",
					"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
				),
				createCommit("refactor: add test file"),
				createCommit("feat: initial commit", "BREAKING CHANGE: this is a breaking change"),
			];

			const parsedCommits = commits.map(parser.parse);

			expect(parsedCommits[0]).toStrictEqual({
				raw: "refactor: this is a long commit message with a lot of content in it which I'm wondering how it would be handled by the commit log parsing system so we'll see what happens.\nLorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
				subject:
					"refactor: this is a long commit message with a lot of content in it which I'm wondering how it would be handled by the commit log parsing system so we'll see what happens.",
				body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
				hash,
				date,
				name,
				email,

				type: "refactor",
				scope: "",
				breakingChange: "",
				title:
					"this is a long commit message with a lot of content in it which I'm wondering how it would be handled by the commit log parsing system so we'll see what happens.",

				merge: null,
				revert: null,
				notes: [],
				mentions: [],
				references: [],
			} as Commit);
			expect(parsedCommits[1]).toStrictEqual({
				raw: "refactor: add test file",
				subject: "refactor: add test file",
				body: "",
				hash,
				date,
				name,
				email,

				type: "refactor",
				scope: "",
				breakingChange: "",
				title: "add test file",

				merge: null,
				revert: null,
				notes: [],
				mentions: [],
				references: [],
			} as Commit);
			expect(parsedCommits[2]).toStrictEqual({
				raw: "feat: initial commit\nBREAKING CHANGE: this is a breaking change",
				subject: "feat: initial commit",
				body: "BREAKING CHANGE: this is a breaking change",
				hash,
				date,
				name,
				email,

				type: "feat",
				scope: "",
				breakingChange: "",
				title: "initial commit",

				merge: null,
				revert: null,
				notes: [
					{
						title: "BREAKING CHANGE",
						text: "this is a breaking change",
					},
				],
				mentions: [],
				references: [],
			} as Commit);
		});

		it("should parse with no name or email", () => {
			const parser = new CommitParser();

			const commit = ["feat: create new feature", "", hash, date, "", ""].join("\n");

			expect(parser.parse(commit)).toStrictEqual({
				raw: "feat: create new feature",
				subject: "feat: create new feature",
				body: "",
				hash,
				date,
				name: "",
				email: "",

				type: "feat",
				scope: "",
				breakingChange: "",
				title: "create new feature",

				merge: null,
				revert: null,
				notes: [],
				mentions: [],
				references: [],
			} as Commit);
		});

		it("should interface with getCommits method from the git class", async () => {
			const { config } = await setupTest("commit-parser");
			const git = new Git(config);
			const parser = new CommitParser();

			await git.commit(
				"--allow-empty",
				"-m",
				"feat: initial commit",
				"-m",
				"BREAKING CHANGE: this is a breaking change",
			);
			await git.commit(
				"--allow-empty",
				"-m",
				"refactor: this is a long commit message with a lot of content in it\nwhich I'm wondering how it would be handled by the commit log parsing\nsystem so we'll see what happens.",
				"-m",
				"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
			);

			const commits = await git.getCommits();
			const parsedCommits = commits.map(parser.parse);

			expect(parsedCommits[0]).toStrictEqual({
				raw: "refactor: this is a long commit message with a lot of content in it which I'm wondering how it would be handled by the commit log parsing system so we'll see what happens.\nLorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
				subject:
					"refactor: this is a long commit message with a lot of content in it which I'm wondering how it would be handled by the commit log parsing system so we'll see what happens.",
				body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
				hash: expect.any(String),
				date: expect.any(String),
				name,
				email,

				type: "refactor",
				scope: "",
				breakingChange: "",
				title:
					"this is a long commit message with a lot of content in it which I'm wondering how it would be handled by the commit log parsing system so we'll see what happens.",

				merge: null,
				revert: null,
				notes: [],
				mentions: [],
				references: [],
			} as Commit);
			expect(parsedCommits[1]).toStrictEqual({
				raw: "feat: initial commit\nBREAKING CHANGE: this is a breaking change",
				subject: "feat: initial commit",
				body: "BREAKING CHANGE: this is a breaking change",
				hash: expect.any(String),
				date: expect.any(String),
				name,
				email,

				type: "feat",
				scope: "",
				breakingChange: "",
				title: "initial commit",

				merge: null,
				revert: null,
				notes: [
					{
						title: "BREAKING CHANGE",
						text: "this is a breaking change",
					},
				],
				mentions: [],
				references: [],
			} as Commit);
		});

		it("should parse type with capital letters", () => {
			const parser = new CommitParser();

			const commit = parser.parse(createCommit("FEAT: add test file"));

			expect(commit).toMatchObject({
				type: "FEAT",
				title: "add test file",
			});
		});
	});

	describe("error handling", () => {
		let debugSpy: MockInstance;
		let logger: Logger;

		beforeAll(() => {
			logger = new Logger({ silent: false, debug: true, inspectVersion: false });
		});
		beforeEach(() => {
			debugSpy = vi.spyOn(global.console, "debug").mockImplementation(() => undefined);
		});
		afterEach(() => {
			debugSpy.mockRestore();
		});

		it("should log if date and email are swapped", () => {
			const parser = new CommitParser().setLogger(logger);

			const commit = ["refactor: add test file", "", hash, name, email, date, ""].join("\n");

			expect(parser.parse(commit)).toBe(undefined);
			expect(debugSpy).toHaveBeenCalledOnce();
		});

		it("should throw if unknown extra content", () => {
			const parser = new CommitParser().setLogger(logger);

			const commit = ["refactor: add test file", "", hash, date, name, email, "extra line"].join(
				"\n",
			);

			expect(parser.parse(commit)).toBe(undefined);
			expect(debugSpy).toHaveBeenCalledOnce();
		});

		it("should throw if missing data", () => {
			const parser = new CommitParser().setLogger(logger);

			const commit = ["refactor: add test file", "", hash, date, name].join("\n");

			expect(parser.parse(commit)).toBe(undefined);
			expect(debugSpy).toHaveBeenCalledOnce();
		});

		it("should not log if not passed a logger instance", () => {
			const parser = new CommitParser();

			const commit = ["refactor: add test file", "", hash, name, email, date, ""].join("\n");

			expect(parser.parse(commit)).toBe(undefined);
			expect(debugSpy).not.toHaveBeenCalled();
		});
	});

	describe("parse conventional commit from subject", () => {
		it("should parse type and title", () => {
			const parser = new CommitParser();

			const commit = parser.parse(createCommit("refactor: add test file"));

			expect(commit).toStrictEqual({
				raw: "refactor: add test file",
				subject: "refactor: add test file",
				body: "",
				hash,
				date,
				name,
				email,

				type: "refactor",
				scope: "",
				breakingChange: "",
				title: "add test file",

				merge: null,
				revert: null,
				notes: [],
				mentions: [],
				references: [],
			} as Commit);
		});

		it("should parse type, scope and title", () => {
			const parser = new CommitParser();

			const commit = parser.parse(createCommit("feat(login): new form implemented"));

			expect(commit).toStrictEqual({
				raw: "feat(login): new form implemented",
				subject: "feat(login): new form implemented",
				body: "",
				hash,
				date,
				name,
				email,

				type: "feat",
				scope: "login",
				breakingChange: "",
				title: "new form implemented",

				merge: null,
				revert: null,
				notes: [],
				mentions: [],
				references: [],
			} as Commit);
		});

		it("should parse type, bang and title", () => {
			const parser = new CommitParser();

			const commit = parser.parse(createCommit("feat!: new form implemented"));

			expect(commit).toStrictEqual({
				raw: "feat!: new form implemented",
				subject: "feat!: new form implemented",
				body: "",
				hash,
				date,
				name,
				email,

				type: "feat",
				scope: "",
				breakingChange: "!",
				title: "new form implemented",

				merge: null,
				revert: null,
				notes: [],
				mentions: [],
				references: [],
			} as Commit);
		});

		it("should parse type, scope, bang and title", () => {
			const parser = new CommitParser();

			const commit = parser.parse(createCommit("feat(login:form/register)!: new form implemented"));

			expect(commit).toStrictEqual({
				raw: "feat(login:form/register)!: new form implemented",
				subject: "feat(login:form/register)!: new form implemented",
				body: "",
				hash,
				date,
				name,
				email,

				type: "feat",
				scope: "login:form/register",
				breakingChange: "!",
				title: "new form implemented",

				merge: null,
				revert: null,
				notes: [],
				mentions: [],
				references: [],
			} as Commit);
		});

		it("should parse empty scope", () => {
			const parser = new CommitParser();

			const commit = parser.parse(createCommit("feat(): new form implemented"));

			expect(commit).toStrictEqual({
				raw: "feat(): new form implemented",
				subject: "feat(): new form implemented",
				body: "",
				hash,
				date,
				name,
				email,

				type: "feat",
				scope: "",
				breakingChange: "",
				title: "new form implemented",

				merge: null,
				revert: null,
				notes: [],
				mentions: [],
				references: [],
			} as Commit);
		});

		it("should parse empty scope and bang", () => {
			const parser = new CommitParser();

			const commit = parser.parse(createCommit("feat()!: new form implemented"));

			expect(commit).toStrictEqual({
				raw: "feat()!: new form implemented",
				subject: "feat()!: new form implemented",
				body: "",
				hash,
				date,
				name,
				email,

				type: "feat",
				scope: "",
				breakingChange: "!",
				title: "new form implemented",

				merge: null,
				revert: null,
				notes: [],
				mentions: [],
				references: [],
			} as Commit);
		});
	});

	describe("body content", () => {
		it("should trim start and end of body", () => {
			const parser = new CommitParser();

			const commit = parser.parse(
				createCommit("feat: initial commit", "    This is a body with spaces    "),
			);

			expect(commit).toMatchObject({
				body: "This is a body with spaces",
			});
		});

		it("should reatin spaces insde body content", () => {
			const parser = new CommitParser();

			const commit = parser.parse(
				createCommit(
					"feat: initial commit",
					`    This is a body with spaces
    and indented content
  that should be kept    `,
				),
			);

			expect(commit).toMatchObject({
				body: `This is a body with spaces
    and indented content
  that should be kept`,
			});
		});
	});

	describe("merges", () => {
		it("should parse merge commit", () => {
			const parser = new CommitParser();

			const commit = parser.parse(
				createCommit("Merge pull request #123 from fork-version/feature", "feat: initial commit"),
			);

			expect(commit).toMatchObject({
				raw: "Merge pull request #123 from fork-version/feature\nfeat: initial commit",
				subject: "Merge pull request #123 from fork-version/feature",
				body: "feat: initial commit",

				type: "",
				scope: "",
				breakingChange: "",
				title: "",

				merge: {
					id: "123",
					source: "fork-version/feature",
				},
				references: [
					{
						prefix: "#",
						issue: "123",
						action: null,
						owner: null,
						repository: null,
					},
				],
			});
		});

		it("should parse merge commit with no source", () => {
			const parser = new CommitParser();

			const commit = parser.parse(createCommit("Merge pull request #123 from ", "Extra content"));

			expect(commit).toMatchObject({
				raw: "Merge pull request #123 from \nExtra content",
				subject: "Merge pull request #123 from ",
				body: "Extra content",

				type: "",
				scope: "",
				breakingChange: "",
				title: "",

				merge: {
					id: "123",
					source: "",
				},
				references: [
					{
						prefix: "#",
						issue: "123",
						action: null,
						owner: null,
						repository: null,
					},
				],
			});
		});

		it("should parse merge commit with no id or source", () => {
			const parser = new CommitParser();

			const commit = parser.parse(createCommit("Merge pull request # from ", "Extra content"));

			expect(commit).toMatchObject({
				raw: "Merge pull request # from \nExtra content",
				subject: "Merge pull request # from ",
				body: "Extra content",

				type: "",
				scope: "",
				breakingChange: "",
				title: "",

				merge: {
					id: "",
					source: "",
				},
				references: [],
			});
		});
	});

	describe("reverts", () => {
		it("should parse revert commit", () => {
			const parser = new CommitParser();

			const commit = parser.parse(
				createCommit(
					`Revert "feat: initial commit"

This reverts commit 4a79e9e546b4020d2882b7810dc549fa71960f4f.`,
				),
			);

			expect(commit).toMatchObject({
				type: "",
				scope: "",
				breakingChange: "",
				title: "",

				revert: {
					hash: "4a79e9e546b4020d2882b7810dc549fa71960f4f",
					subject: "feat: initial commit",
				},
			});
		});

		it("should parse revert commit with lowercase r", () => {
			const parser = new CommitParser();

			const commit = parser.parse(
				createCommit(
					`revert "feat: initial commit"

This reverts commit 4a79e9e546b4020d2882b7810dc549fa71960f4f.`,
				),
			);

			expect(commit).toMatchObject({
				type: "",
				scope: "",
				breakingChange: "",
				title: "",

				revert: {
					hash: "4a79e9e546b4020d2882b7810dc549fa71960f4f",
					subject: "feat: initial commit",
				},
			});
		});

		it("should parse revert commit with no hash", () => {
			const parser = new CommitParser();

			const commit = parser.parse(createCommit(' Revert "feat: initial commit"'));

			expect(commit).toMatchObject({
				type: "",
				scope: "",
				breakingChange: "",
				title: "",

				revert: {
					hash: "",
					subject: "feat: initial commit",
				},
			});
		});

		it("should parse revert commit with no subject or hash", () => {
			const parser = new CommitParser();

			const commit = parser.parse(
				createCommit(`Revert ""

This reverts commit .`),
			);

			expect(commit).toMatchObject({
				type: "",
				scope: "",
				breakingChange: "",
				title: "",

				revert: {
					hash: "",
					subject: "",
				},
			});
		});
	});

	describe("comments", () => {
		it("should not parse commented out lines", () => {
			const parser = new CommitParser();

			const commit = parser.parse(
				createCommit(
					"feat: initial commit",
					`# BREAKING CHANGE:
  # @ignored-mention
Content that will be kept
# closes #123
	`,
				),
			);

			expect(commit).toStrictEqual({
				raw: "feat: initial commit\n# BREAKING CHANGE:\n  # @ignored-mention\nContent that will be kept\n# closes #123",
				subject: "feat: initial commit",
				body: "Content that will be kept",
				hash,
				date,
				name,
				email,

				type: "feat",
				scope: "",
				breakingChange: "",
				title: "initial commit",

				merge: null,
				revert: null,
				notes: [],
				mentions: [],
				references: [],
			} as Commit);
		});

		it("should not parse commented out lines with custom pattern", () => {
			const parser = new CommitParser({
				commentPattern: /^\/\/(.*)/,
			});

			const commit = parser.parse(
				createCommit(
					"feat: initial commit",
					`// BREAKING CHANGE:
  // @ignored-mention
Content that will be kept
// closes #123
	`,
				),
			);

			expect(commit).toStrictEqual({
				raw: "feat: initial commit\n// BREAKING CHANGE:\n  // @ignored-mention\nContent that will be kept\n// closes #123",
				subject: "feat: initial commit",
				body: "Content that will be kept",
				hash,
				date,
				name,
				email,

				type: "feat",
				scope: "",
				breakingChange: "",
				title: "initial commit",

				merge: null,
				revert: null,
				notes: [],
				mentions: [],
				references: [],
			} as Commit);
		});

		it("should parse commented out lines if commentPattern option is null", () => {
			const parser = new CommitParser({
				commentPattern: undefined,
			});

			const commit = parser.parse(
				createCommit(
					"feat: initial commit",
					`# BREAKING CHANGE:
  # @ignored-mention
Content that will be kept
# closes #123
	`,
				),
			);

			expect(commit).toMatchObject({
				body: "# BREAKING CHANGE:\n  # @ignored-mention\nContent that will be kept\n# closes #123",

				breakingChange: "",

				mentions: ["ignored-mention"],
				references: [
					{
						prefix: "#",
						issue: "123",
						action: "closes",
						owner: null,
						repository: null,
					},
				],
			});
		});
	});

	describe("mentions", () => {
		it("should parse mentions", () => {
			const parser = new CommitParser();

			const commit = parser.parse(
				createCommit(
					"feat: initial commit @eglavin",
					`@user Mentioning @eglavin and @fork-version
Signed-off-by: Fork Version <fork-version@example.com>
   #   @ignored
`,
				),
			);

			expect(commit).toMatchObject({
				mentions: ["eglavin", "user", "fork-version"],
			});
		});
	});

	describe("references", () => {
		it("should parse references", () => {
			const parser = new CommitParser({
				issuePrefixes: ["#", "gh-"],
			});

			const commit = parser.parse(
				createCommit(
					"feat: initial commit closes #123",
					`This is a reference to #456

Closes gh-456, #789
fixes owner/repo#1234
# ignored
# closes #1
        closes   gh-88 fixes #89`,
				),
			);

			expect(commit).toMatchObject({
				references: [
					{ prefix: "#", issue: "123", action: "closes", owner: null, repository: null },
					{ prefix: "#", issue: "456", action: null, owner: null, repository: null },
					{ prefix: "gh-", issue: "456", action: "Closes", owner: null, repository: null },
					{ prefix: "#", issue: "789", action: "Closes", owner: null, repository: null },
					{ prefix: "#", issue: "1234", action: "fixes", owner: "owner", repository: "repo" },
					{ prefix: "gh-", issue: "88", action: "closes", owner: null, repository: null },
					{ prefix: "#", issue: "89", action: "fixes", owner: null, repository: null },
				],
			});
		});

		it("should parse references with custom actions", () => {
			const parser = new CommitParser({
				referenceActions: ["closes", "finishes"],
			});

			const commit = parser.parse(
				createCommit(
					"feat: initial commit closes #123",
					`This is a reference to #456
finishes #789, #800`,
				),
			);

			expect(commit).toMatchObject({
				references: [
					{ prefix: "#", issue: "123", action: "closes", owner: null, repository: null },
					{ prefix: "#", issue: "456", action: null, owner: null, repository: null },
					{ prefix: "#", issue: "789", action: "finishes", owner: null, repository: null },
					{ prefix: "#", issue: "800", action: "finishes", owner: null, repository: null },
				],
			});
		});
	});

	describe("notes", () => {
		it("should parse notes", () => {
			const parser = new CommitParser();

			const commit = parser.parse(
				createCommit("feat: initial commit", `BREAKING CHANGE: this is a breaking change`),
			);

			expect(commit).toMatchObject({
				breakingChange: "",

				notes: [
					{
						title: "BREAKING CHANGE",
						text: "this is a breaking change",
					},
				],
			});
		});

		it("should parse multi line notes", () => {
			const parser = new CommitParser();

			const commit = parser.parse(
				createCommit(
					"feat: initial commit",
					`BREAKING CHANGE: this is a breaking change
that spans multiple lines
with more content
here.`,
				),
			);

			expect(commit).toMatchObject({
				breakingChange: "",

				notes: [
					{
						title: "BREAKING CHANGE",
						text: "this is a breaking change\nthat spans multiple lines\nwith more content\nhere.",
					},
				],
			});
		});

		it("should parse multiple notes", () => {
			const parser = new CommitParser();

			const commit = parser.parse(
				createCommit(
					"feat: initial commit",
					`BREAKING CHANGE: this is a breaking change
that spans multiple lines
with more content
here.

 BREAKING-CHANGE: this is another breaking change
which also spans multiple lines
  with some more content
on this line.

This is some extra content that should be added to the previous note.

fixes owner/repo#1234 @fork-version

This is some other content that shouldn't be added to the previous note.
`,
				),
			);

			expect(commit).toMatchObject({
				breakingChange: "",

				notes: [
					{
						title: "BREAKING CHANGE",
						text: "this is a breaking change\nthat spans multiple lines\nwith more content\nhere.",
					},
					{
						title: "BREAKING-CHANGE",
						text: "this is another breaking change\nwhich also spans multiple lines\n  with some more content\non this line.\n\nThis is some extra content that should be added to the previous note.",
					},
				],
				mentions: ["fork-version"],
				references: [
					{ prefix: "#", issue: "1234", action: "fixes", owner: "owner", repository: "repo" },
				],
			});
		});

		it("should parse notes with custom keywords", () => {
			const parser = new CommitParser({
				noteKeywords: ["CUSTOM NOTE"],
			});

			const commit = parser.parse(
				createCommit("feat: initial commit", `CUSTOM NOTE: this is a custom breaking change`),
			);

			expect(commit).toMatchObject({
				breakingChange: "",

				notes: [
					{
						title: "CUSTOM NOTE",
						text: "this is a custom breaking change",
					},
				],
			});
		});

		it("should parse multi line notes with mentions", () => {
			const parser = new CommitParser();

			const commit = parser.parse(
				createCommit(
					"feat: initial commit",
					`BREAKING CHANGE: this is a breaking change
that spans multiple lines
with more content
here including this mention @fork-version.`,
				),
			);

			expect(commit).toMatchObject({
				breakingChange: "",

				notes: [
					{
						title: "BREAKING CHANGE",
						text: "this is a breaking change\nthat spans multiple lines\nwith more content\nhere including this mention @fork-version.",
					},
				],
				mentions: ["fork-version"],
			});
		});
	});
});
