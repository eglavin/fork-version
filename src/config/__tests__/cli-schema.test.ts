import { deriveParseArgsOptions, type ParseArgsOptions } from "../cli-schema";

/**
 * The exact `parseArgs` options `getCliArguments()` runs on. Locking the full object here means a
 * Zod upgrade that changes schema internals - or an accidental schema change - fails loudly rather
 * than silently dropping a flag.
 */
const EXPECTED: ParseArgsOptions = {
	// Meta flags (no matching config key)
	help: { type: "boolean", short: "h" },
	version: { type: "boolean", short: "v" },

	// `preRelease` union split + deprecated alias
	"pre-release": { type: "boolean" },
	"pre-release-tag": { type: "string" },
	"release-commit-message-format": { type: "string" },

	// Derived from ForkConfigJSONSchema
	"inspect-version": { type: "boolean" },
	files: { type: "string", multiple: true, short: "F" },
	file: { type: "string", multiple: true },
	glob: { type: "string", short: "G" },
	path: { type: "string", short: "P" },
	changelog: { type: "string" },
	header: { type: "string" },
	"release-message-format": { type: "string" },
	"release-message-suffix": { type: "string" },
	"tag-prefix": { type: "string" },
	"current-version": { type: "string" },
	"next-version": { type: "string" },
	"release-as": { type: "string" },
	"allow-multiple-versions": { type: "boolean" },
	"commit-all": { type: "boolean" },
	"changelog-all": { type: "boolean" },
	debug: { type: "boolean" },
	"dry-run": { type: "boolean" },
	silent: { type: "boolean" },
	"git-tag-fallback": { type: "boolean" },
	sign: { type: "boolean" },
	verify: { type: "boolean" },
	"as-json": { type: "boolean" },
	"skip-bump": { type: "boolean" },
	"skip-changelog": { type: "boolean" },
	"skip-commit": { type: "boolean" },
	"skip-tag": { type: "boolean" },

	// Derived from WriterOptionsSchema
	"commit-url-format": { type: "string" },
	"compare-url-format": { type: "string" },
	"issue-url-format": { type: "string" },
	"user-url-format": { type: "string" },
};

describe("deriveParseArgsOptions", () => {
	const options = deriveParseArgsOptions();

	it("produces the expected parseArgs options", () => {
		expect(options).toStrictEqual(EXPECTED);
	});

	it("only emits string or boolean option types", () => {
		for (const option of Object.values(options)) {
			expect(["string", "boolean"]).toContain(option.type);
		}
	});

	it("marks the repeatable file flags as multiple", () => {
		expect(options.files.multiple).toBe(true);
		expect(options.file.multiple).toBe(true);
	});

	it("excludes positional and internal config keys", () => {
		for (const key of [
			"command",
			"types",
			"detected-git-host",
			"commit-parser-options",
			"changelog-writer-options",
			"pre-release-tag-prefix",
		]) {
			expect(options).not.toHaveProperty(key);
		}
	});

	it("splits the preRelease union into two flags", () => {
		expect(options["pre-release"]).toStrictEqual({ type: "boolean" });
		expect(options["pre-release-tag"]).toStrictEqual({ type: "string" });
		expect(options).not.toHaveProperty("preRelease");
	});
});
