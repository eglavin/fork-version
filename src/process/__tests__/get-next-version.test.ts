import { setupTest } from "../../../tests/setup-tests";
import { getNextVersion } from "../get-next-version";
import type { Commit } from "../../commit-parser/types";

describe("getNextVersion", () => {
	it("should recommend a patch bump when no commits found", async () => {
		const { config, logger } = await setupTest("version getNextVersion");

		const result = await getNextVersion(config, logger, [], "1.2.3");
		expect(result).toStrictEqual({
			version: "1.2.4",
			releaseType: "patch",
			preMajor: false,
			changes: {
				major: 0,
				minor: 0,
				patch: 0,
			},
		});
	});

	it("should recommend a patch bump", async () => {
		const { config, logger } = await setupTest("version getNextVersion");

		const commit = {
			type: "fix",
			breakingChange: "",
			notes: [],
		} as unknown as Commit;

		const result = await getNextVersion(config, logger, [commit], "1.2.3");
		expect(result).toStrictEqual({
			version: "1.2.4",
			releaseType: "patch",
			preMajor: false,
			changes: {
				major: 0,
				minor: 0,
				patch: 1,
			},
		});
	});

	it("should recommend a minor bump", async () => {
		const { config, logger } = await setupTest("version getNextVersion");

		const commit = {
			type: "feat",
			breakingChange: "",
			notes: [],
		} as unknown as Commit;

		const result = await getNextVersion(config, logger, [commit], "1.2.3");
		expect(result).toStrictEqual({
			version: "1.3.0",
			releaseType: "minor",
			preMajor: false,
			changes: {
				major: 0,
				minor: 1,
				patch: 0,
			},
		});
	});

	it("should recommend a major bump", async () => {
		const { config, logger } = await setupTest("version getNextVersion");

		const commit = {
			type: "feat",
			breakingChange: "!",
			notes: [],
		} as unknown as Commit;

		const result = await getNextVersion(config, logger, [commit], "1.2.3");
		expect(result).toStrictEqual({
			version: "2.0.0",
			releaseType: "major",
			preMajor: false,
			changes: {
				major: 1,
				minor: 0,
				patch: 0,
			},
		});
	});

	it("should recommend a major bump from notes", async () => {
		const { config, logger } = await setupTest("version getNextVersion");

		const commit = {
			type: "feat",
			breakingChange: "",
			notes: [
				{
					title: "BREAKING CHANGE",
					text: "A breaking change",
				},
			],
		} as unknown as Commit;

		const result = await getNextVersion(config, logger, [commit], "1.2.3");
		expect(result).toStrictEqual({
			version: "2.0.0",
			releaseType: "major",
			preMajor: false,
			changes: {
				major: 1,
				minor: 0,
				patch: 0,
			},
		});
	});

	it("should recommend a pre-major patch bump", async () => {
		const { config, logger } = await setupTest("version getNextVersion");

		const commit = {
			type: "feat",
			breakingChange: "",
			notes: [],
		} as unknown as Commit;

		const result = await getNextVersion(config, logger, [commit], "0.1.0");
		expect(result).toStrictEqual({
			version: "0.1.1",
			releaseType: "patch",
			preMajor: true,
			changes: {
				major: 0,
				minor: 0,
				patch: 1,
			},
		});
	});

	it("should recommend a pre-major minor bump", async () => {
		const { config, logger } = await setupTest("version getNextVersion");

		const commit = {
			type: "feat",
			breakingChange: "!",
			notes: [],
		} as unknown as Commit;

		const result = await getNextVersion(config, logger, [commit], "0.1.0");
		expect(result).toStrictEqual({
			version: "0.2.0",
			releaseType: "minor",
			preMajor: true,
			changes: {
				major: 0,
				minor: 1,
				patch: 0,
			},
		});
	});

	it("should recommend a pre-major minor bump from notes", async () => {
		const { config, logger } = await setupTest("version getNextVersion");

		const commit = {
			type: "feat",
			breakingChange: "",
			notes: [
				{
					title: "BREAKING CHANGE",
					text: "A breaking change",
				},
			],
		} as unknown as Commit;

		const result = await getNextVersion(config, logger, [commit], "0.1.0");
		expect(result).toStrictEqual({
			version: "0.2.0",
			releaseType: "minor",
			preMajor: true,
			changes: {
				major: 0,
				minor: 1,
				patch: 0,
			},
		});
	});

	it('should be able to set "releaseAs" as a patch bump', async () => {
		const { config, logger } = await setupTest("version getNextVersion");
		config.releaseAs = "patch";

		const result = await getNextVersion(config, logger, [], "1.2.3");
		expect(result).toStrictEqual({
			version: "1.2.4",
			releaseType: "patch",
			preMajor: false,
			changes: {
				major: 0,
				minor: 0,
				patch: 0,
			},
		});
	});

	it('should be able to set "releaseAs" as a minor bump', async () => {
		const { config, logger } = await setupTest("version getNextVersion");
		config.releaseAs = "minor";

		const result = await getNextVersion(config, logger, [], "1.2.3");
		expect(result).toStrictEqual({
			version: "1.3.0",
			releaseType: "minor",
			preMajor: false,
			changes: {
				major: 0,
				minor: 0,
				patch: 0,
			},
		});
	});

	it('should be able to set "releaseAs" as a major bump', async () => {
		const { config, logger } = await setupTest("version getNextVersion");
		config.releaseAs = "major";

		const result = await getNextVersion(config, logger, [], "1.2.3");
		expect(result).toStrictEqual({
			version: "2.0.0",
			releaseType: "major",
			preMajor: false,
			changes: {
				major: 0,
				minor: 0,
				patch: 0,
			},
		});
	});

	it('should be able to set "releaseAs" and "preRelease" to create an alpha release', async () => {
		const { config, logger } = await setupTest("version getNextVersion");
		config.releaseAs = "major";
		config.preRelease = "alpha";

		const result = await getNextVersion(config, logger, [], "1.2.3");
		expect(result).toStrictEqual({
			version: "2.0.0-alpha.0",
			releaseType: "premajor",
			preMajor: false,
			changes: {
				major: 0,
				minor: 0,
				patch: 0,
			},
		});

		const result2 = await getNextVersion(config, logger, [], "2.0.0-alpha.0");
		expect(result2).toStrictEqual({
			version: "2.0.0-alpha.1",
			releaseType: "prerelease",
			preMajor: false,
			changes: {
				major: 0,
				minor: 0,
				patch: 0,
			},
		});
	});

	it("should skip version bump", async () => {
		const { config, logger } = await setupTest("version getNextVersion");
		config.skipBump = true;

		const result = await getNextVersion(config, logger, [], "1.2.3");
		expect(result).toStrictEqual({ version: "1.2.3" });
	});

	it("should be able to define the next version using the config", async () => {
		const { config, logger } = await setupTest("version getNextVersion");
		config.nextVersion = "2.0.0";

		const result = await getNextVersion(config, logger, [], "1.2.3");
		expect(result).toStrictEqual({ version: "2.0.0" });
	});

	it("should throw an error if next version in config is invalid", async () => {
		const { config, logger } = await setupTest("version getNextVersion");
		config.nextVersion = "invalid";

		await expect(getNextVersion(config, logger, [], "1.2.3")).rejects.toThrow(
			"Invalid Version: invalid",
		);
	});

	it("should handle an invalid current version", async () => {
		const { config, logger } = await setupTest("version getNextVersion");

		await expect(getNextVersion(config, logger, [], "invalid")).rejects.toThrow(
			"Invalid Version: invalid",
		);
	});

	it("should handle capitalized feat commit types", async () => {
		const { config, logger } = await setupTest("version getNextVersion");

		const commit = {
			type: "Feat",
			breakingChange: "",
			notes: [],
		} as unknown as Commit;

		const result = await getNextVersion(config, logger, [commit], "1.2.3");
		expect(result).toStrictEqual({
			version: "1.3.0",
			releaseType: "minor",
			preMajor: false,
			changes: {
				major: 0,
				minor: 1,
				patch: 0,
			},
		});
	});

	it("should not count merges or reverts as changes", async () => {
		const { config, logger } = await setupTest("version getNextVersion");

		const mergeCommit = {
			type: "",
			breakingChange: "",
			notes: [],
			merge: {
				id: 1,
				source: "branch",
			},
		} as unknown as Commit;

		const revertCommit = {
			type: "",
			breakingChange: "",
			notes: [],
			revert: {
				subject: "This is a revert",
				hash: "abc123",
			},
		} as unknown as Commit;

		const result = await getNextVersion(config, logger, [mergeCommit, revertCommit], "1.2.3");

		expect(result).toStrictEqual({
			version: "1.2.4",
			releaseType: "patch",
			preMajor: false,
			changes: {
				major: 0,
				minor: 0,
				patch: 0,
			},
		});
	});
});
