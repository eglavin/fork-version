import { createParserOptions, type ParserOptions } from "./options";
import { ParserError } from "./parser-error";
import type { Logger } from "../utils/logger";
import type { Commit, CommitNote, CommitReference } from "./types";

export class CommitParser {
	#options: ParserOptions;
	#logger?: Logger;

	constructor(userOptions?: Partial<ParserOptions>) {
		this.#options = createParserOptions(userOptions);

		this.setLogger = this.setLogger.bind(this);
		this.createCommit = this.createCommit.bind(this);
		this.parseRawCommit = this.parseRawCommit.bind(this);
		this.parseSubject = this.parseSubject.bind(this);
		this.parseMerge = this.parseMerge.bind(this);
		this.parseRevert = this.parseRevert.bind(this);
		this.parseMentions = this.parseMentions.bind(this);
		this.parseReferenceParts = this.parseReferenceParts.bind(this);
		this.parseReferences = this.parseReferences.bind(this);
		this.parseNotes = this.parseNotes.bind(this);
		this.parseRawLines = this.parseRawLines.bind(this);
		this.parse = this.parse.bind(this);
	}

	setLogger(logger: Logger) {
		this.#logger = logger;
		return this;
	}

	createCommit(): Commit {
		return {
			raw: "",

			subject: "",
			body: "",
			hash: "",
			date: "",
			name: "",
			email: "",

			type: "",
			scope: "",
			breakingChange: "",
			title: "",

			merge: null,
			revert: null,
			notes: [],
			mentions: [],
			references: [],
		};
	}

	/**
	 * Parse the raw commit message into its expected parts
	 * - subject
	 * - body
	 * - hash
	 * - date
	 * - name
	 * - email
	 *
	 * @throws {ParserError}
	 */
	parseRawCommit(rawCommit: string): Commit {
		const parsedCommit = this.createCommit();

		const parts = rawCommit.split(/\r?\n/);
		if (parts.length < 6) {
			throw new ParserError("Commit doesn't contain enough parts", rawCommit);
		}

		// Walk backwards through the parts array to extract the data in the expected order
		// - committer email
		// - committer name
		// - committer date
		// - hash

		const email = parts.pop();
		const name = parts.pop();
		const date = parts.pop();
		const hash = parts.pop();

		if (email) parsedCommit.email = email.trim();
		if (name) parsedCommit.name = name.trim();
		if (date) {
			parsedCommit.date = date.trim();

			// Date is one of the only fields we can properly validate, check to ensure its in the correct position
			if (Number.isNaN(Date.parse(parsedCommit.date))) {
				throw new ParserError("Unable to parse commit date", rawCommit);
			}
		}
		if (hash) parsedCommit.hash = hash.trim();

		// Take the subject from the front of the array, the remainder is the commit body

		const subject = parts.shift()?.trimStart();
		if (subject) {
			parsedCommit.subject = subject;
			parsedCommit.raw = subject;
		}

		parsedCommit.body = parts
			.filter((line) => {
				if (this.#options.commentPattern) {
					return !this.#options.commentPattern.test(line.trim());
				}

				return true;
			})
			.join("\n")
			.trim();

		const raw = parts.join("\n").trim();
		if (raw) parsedCommit.raw += "\n" + raw;

		return parsedCommit;
	}

	/**
	 * Parse the commit subject into its expected parts
	 * - type
	 * - scope (optional)
	 * - breaking change (optional)
	 * - title
	 *
	 * @throws {ParserError}
	 */
	parseSubject(commit: Commit) {
		if (!this.#options.subjectPattern) return false;

		const subjectMatch = new RegExp(this.#options.subjectPattern, "i").exec(commit.subject);

		if (subjectMatch?.groups) {
			const { type = "", scope = "", breakingChange = "", title = "" } = subjectMatch.groups;

			if (!type || !title) {
				throw new ParserError("Unable to parse commit subject", commit);
			}

			commit.type = type;
			commit.scope = scope;
			if (breakingChange) commit.breakingChange = breakingChange;
			commit.title = title;

			return true;
		}

		return false;
	}

	/**
	 * Parse merge information from the commit subject
	 * @example
	 * ```txt
	 * "Merge pull request #123 from fork-version/feature"
	 * ```
	 */
	parseMerge(commit: Commit) {
		if (!this.#options.mergePattern) return false;

		const mergeMatch = new RegExp(this.#options.mergePattern).exec(commit.subject);

		if (mergeMatch?.groups) {
			const { id = "", source = "" } = mergeMatch.groups;

			commit.merge = {
				id,
				source,
			};

			return true;
		}

		return false;
	}

	/**
	 * Parse revert information from the commit body
	 * @example
	 * ```txt
	 * "Revert "feat: initial commit"
	 *
	 * This reverts commit 4a79e9e546b4020d2882b7810dc549fa71960f4f."
	 * ```
	 */
	parseRevert(commit: Commit) {
		if (!this.#options.revertPattern) return false;

		const revertMatch = new RegExp(this.#options.revertPattern).exec(commit.raw);

		if (revertMatch?.groups) {
			const { hash = "", subject = "" } = revertMatch.groups;

			commit.revert = {
				hash,
				subject,
			};

			return true;
		}

		return false;
	}

	/**
	 * Search for mentions from the commit line
	 * @example
	 * ```txt
	 * "@fork-version"
	 * ```
	 */
	parseMentions(line: string, outMentions: Set<string>) {
		if (!this.#options.mentionPattern) return false;

		const mentionRegex = new RegExp(this.#options.mentionPattern, "g");

		let foundMention = false;
		let mentionMatch: RegExpExecArray | null;
		while ((mentionMatch = mentionRegex.exec(line))) {
			if (!mentionMatch) {
				break;
			}

			const { username = "" } = mentionMatch.groups ?? {};

			outMentions.add(username);
			foundMention = true;
		}

		return foundMention;
	}

	/**
	 * Search for references from the commit line
	 * @example
	 * ```txt
	 * "#1234"
	 * "owner/repo#1234"
	 * ```
	 */
	parseReferenceParts(referenceText: string, action: string | null): CommitReference[] | undefined {
		if (!this.#options.issuePattern) return undefined;

		const references: CommitReference[] = [];

		const issueRegex = new RegExp(this.#options.issuePattern, "gi");
		let issueMatch: RegExpExecArray | null;
		while ((issueMatch = issueRegex.exec(referenceText))) {
			if (!issueMatch) {
				break;
			}

			const { repository = "", prefix = "", issue = "" } = issueMatch.groups ?? {};

			const reference: CommitReference = {
				prefix,
				issue,
				action,
				owner: null,
				repository: null,
			};

			if (repository) {
				const slashIndex = repository.indexOf("/");
				if (slashIndex !== -1) {
					reference.owner = repository.slice(0, slashIndex);
					reference.repository = repository.slice(slashIndex + 1);
				} else {
					reference.repository = repository;
				}
			}

			references.push(reference);
		}

		if (references.length > 0) {
			return references;
		}

		return undefined;
	}

	/**
	 * Search for actions and references from the commit line
	 * @example
	 * ```txt
	 * "Closes #1234"
	 * "fixes owner/repo#1234"
	 * ```
	 */
	parseReferences(line: string, outReferences: CommitReference[]) {
		if (!this.#options.referenceActionPattern || !this.#options.issuePattern) return false;

		const referenceActionRegex = new RegExp(this.#options.referenceActionPattern, "gi").test(line)
			? new RegExp(this.#options.referenceActionPattern, "gi")
			: /(?<reference>.*)/g;

		let foundReference = false;
		let referenceActionMatch: RegExpExecArray | null;
		while ((referenceActionMatch = referenceActionRegex.exec(line))) {
			if (!referenceActionMatch) {
				break;
			}

			const { action = "", reference = "" } = referenceActionMatch.groups ?? {};

			const parsedReferences = this.parseReferenceParts(reference, action || null);
			if (!parsedReferences) {
				break;
			}

			for (const ref of parsedReferences) {
				if (!outReferences.some((r) => r.prefix === ref.prefix && r.issue === ref.issue)) {
					outReferences.push(ref);
				}
			}
			foundReference = true;
		}

		return foundReference;
	}

	/**
	 * Search for notes from the commit line
	 * @example
	 * ```txt
	 * "BREAKING CHANGE: this is a breaking change"
	 * ```
	 */
	parseNotes(line: string, outNotes: CommitNote[]) {
		if (!this.#options.notePattern) return false;

		const noteMatch = new RegExp(this.#options.notePattern, "ig").exec(line);

		if (noteMatch?.groups) {
			const { title = "", text = "" } = noteMatch.groups;

			outNotes.push({
				title,
				text,
			});

			return true;
		}

		return false;
	}

	/**
	 * Parse the raw commit for mentions, references and notes
	 */
	parseRawLines(commit: Commit) {
		const mentions = new Set<string>();
		const references: CommitReference[] = [];
		const notes: CommitNote[] = [];
		let lastNoteLine = -1;

		const splitMessage = commit.raw.split("\n");
		for (let index = 0; index < splitMessage.length; index++) {
			const line = splitMessage[index];
			const trimmedLine = line.trim();

			if (this.#options.commentPattern?.test(trimmedLine)) {
				continue;
			}

			this.parseMentions(trimmedLine, mentions);
			const foundReference = this.parseReferences(trimmedLine, references);

			// If we find a reference, we can assume the previous note is complete.
			if (foundReference) {
				lastNoteLine = -1;
				continue;
			}

			// Once we find a note line, we want to keep adding to the last note object
			// until we find a new note line which will create a new note object.
			if (this.parseNotes(trimmedLine, notes)) {
				lastNoteLine = index;
			} else if (lastNoteLine !== -1) {
				notes[notes.length - 1].text += `\n${line}`;
				lastNoteLine = index;
			}
		}

		if (mentions.size > 0) {
			commit.mentions = Array.from(mentions);
		}
		if (references.length > 0) {
			commit.references = references;
		}
		if (notes.length > 0) {
			commit.notes = notes.map((note) => ({
				...note,
				text: note.text.trim(),
			}));
		}
	}

	/**
	 * Parse a commit log with the following format separated by new line characters:
	 * ```txt
	 * refactor: add test file
	 * Add a test file to the project
	 * 4ef2c86d393a9660aa9f753144256b1f200c16bd
	 * 2024-12-22T17:36:50Z
	 * Fork Version
	 * fork-version@example.com
	 * ```
	 *
	 * @example
	 * ```ts
	 * parse("refactor: add test file\nAdd a test file to the project\n4ef2c86d393a9660aa9f753144256b1f200c16bd\n2024-12-22T17:36:50Z\nFork Version\nfork-version@example.com");
	 * ```
	 *
	 * The expected input value can be generated by running the following command:
	 * ```sh
	 * git log --format="%s%n%b%n%H%n%cI%n%cN%n%cE%n"
	 * ```
	 * @see {@link https://git-scm.com/docs/pretty-formats|Git Pretty Format Documentation}
	 */
	parse(rawCommit: string): Commit | undefined {
		try {
			const commit = this.parseRawCommit(rawCommit);

			this.parseSubject(commit);
			this.parseMerge(commit);
			this.parseRevert(commit);
			this.parseRawLines(commit);

			return commit;
		} catch (error) {
			if (this.#logger) {
				this.#logger.debug("[Commit Parser] Failed to parse commit", { error });
			}

			return undefined;
		}
	}
}
