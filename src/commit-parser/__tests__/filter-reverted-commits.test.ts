/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { CommitParser } from "../commit-parser";
import { filterRevertedCommits } from "../filter-reverted-commits";

const refNames = "HEAD -> main, origin/main, origin/HEAD";
const date = "2024-12-22T17:36:50Z";
const name = "Fork Version";
const email = "fork-version@example.com";

function createCommit({ body, hash }: { body: string; hash: string }) {
	return [body, "\n", hash, refNames, date, name, email].join("\n");
}

describe("filter-reverted-commits", () => {
	it("should return the commits as-is if there are no reverts", () => {
		const parser = new CommitParser();

		const commits = [
			createCommit({
				body: "feat: implement feature",
				hash: "356a192b7913b04c54574d18c28d46e6395428ab",
			}),
			createCommit({
				body: "fix: resolve issue",
				hash: "4ef2c86d393a9660aa9f753144256b1f200c16b3",
			}),
		].map((raw) => parser.parse(raw)!);

		const filteredCommits = filterRevertedCommits(commits);

		expect(filteredCommits).toHaveLength(2);
		expect(filteredCommits[0].revert).toBeNull();
		expect(filteredCommits[1].revert).toBeNull();
	});

	it("should remove reverted commits", () => {
		const parser = new CommitParser();

		const commits = [
			createCommit({
				body: `Revert "feat: implement feature"

This reverts commit 356a192b7913b04c54574d18c28d46e6395428ab.`,
				hash: "1b6453892473a467d07372d45eb05abc2031647a",
			}),
			createCommit({
				body: "feat: implement feature",
				hash: "356a192b7913b04c54574d18c28d46e6395428ab",
			}),
		].map((raw) => parser.parse(raw)!);

		const filteredCommits = filterRevertedCommits(commits);

		expect(filteredCommits).toHaveLength(0);
	});

	it("should remove reverted commits by hash", () => {
		const parser = new CommitParser();

		const commits = [
			createCommit({
				body: "fix: resolve issue",
				hash: "4ef2c86d393a9660aa9f753144256b1f200c16b3",
			}),
			createCommit({
				body: `Revert ""

This reverts commit 356a192b7913b04c54574d18c28d46e6395428ab.`,
				hash: "ac3478d69a3c81fa62e60f5c3696165a4e5e6ac4",
			}),
			createCommit({
				body: "feat: implement feature",
				hash: "356a192b7913b04c54574d18c28d46e6395428ab",
			}),
		].map((raw) => parser.parse(raw)!);

		const filteredCommits = filterRevertedCommits(commits);

		expect(filteredCommits).toHaveLength(1);
		expect(filteredCommits[0].subject).toBe("fix: resolve issue");
	});

	it("should remove reverted commits by subject", () => {
		const parser = new CommitParser();

		const commits = [
			createCommit({
				body: "fix: resolve issue",
				hash: "4ef2c86d393a9660aa9f753144256b1f200c16b3",
			}),
			createCommit({
				body: `Revert "feat: implement feature"

This reverts commit .`,
				hash: "356a192b7913b04c54574d18c28d46e6395428ab",
			}),
			createCommit({
				body: "feat: implement feature",
				hash: "356a192b7913b04c54574d18c28d46e6395428ab",
			}),
		].map((raw) => parser.parse(raw)!);

		const filteredCommits = filterRevertedCommits(commits);

		expect(filteredCommits).toHaveLength(1);
	});

	it("should not remove commits by subject if there are multiple with the same subject", () => {
		const parser = new CommitParser();

		const commits = [
			createCommit({
				body: "fix: resolve issue",
				hash: "4ef2c86d393a9660aa9f753144256b1f200c16b3",
			}),
			createCommit({
				body: `Revert "feat: implement feature"

This reverts commit .`,
				hash: "53949384380cc2b62785275bca38ac261256e278",
			}),
			createCommit({
				body: "feat: implement feature",
				hash: "356a192b7913b04c54574d18c28d46e6395428ab",
			}),
			createCommit({
				body: "feat: implement feature",
				hash: "1b6453892473a467d07372d45eb05abc2031647a",
			}),
		].map((raw) => parser.parse(raw)!);

		const filteredCommits = filterRevertedCommits(commits);

		expect(filteredCommits).toHaveLength(2);
		expect(filteredCommits[0].subject).toBe("fix: resolve issue");
		expect(filteredCommits[1].subject).toBe("feat: implement feature");
	});

	it("should remove reverted revert commits", () => {
		const parser = new CommitParser();

		const commits = [
			createCommit({
				body: "fix: resolve issue",
				hash: "4ef2c86d393a9660aa9f753144256b1f200c16b3",
			}),
			// This revert commit should revert the following revert
			createCommit({
				body: `Revert "Revert "feat: implement feature""

This reverts commit c1dfd96eea8cc2b62785275bca38ac261256e278.`,
				hash: "902ba3cda1883801594b6e1b452790cc53948fda",
			}),
			createCommit({
				body: `Revert "feat: implement feature"

This reverts commit 356a192b7913b04c54574d18c28d46e6395428ab.`,
				hash: "c1dfd96eea8cc2b62785275bca38ac261256e278",
			}),
			createCommit({
				body: "feat: implement feature",
				hash: "356a192b7913b04c54574d18c28d46e6395428ab",
			}),
		].map((raw) => parser.parse(raw)!);

		const filteredCommits = filterRevertedCommits(commits);

		expect(filteredCommits).toHaveLength(2);
		expect(filteredCommits[0].subject).toBe("fix: resolve issue");
		expect(filteredCommits[1].subject).toBe("feat: implement feature");
	});
});
