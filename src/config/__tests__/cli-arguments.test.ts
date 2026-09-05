import { getCliArguments } from "../cli-arguments";
import { helperText } from "../cli-help";
import { deriveParseArgsOptions } from "../cli-schema";

class ProcessExit extends Error {
	constructor(public code: number) {
		super(`process.exit(${code})`);
	}
}

let stdout: ReturnType<typeof vi.spyOn>;
let stderr: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
	stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
	stderr = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
	vi.spyOn(process, "exit").mockImplementation((code) => {
		throw new ProcessExit((code as number | undefined) ?? 0);
	});
});

afterEach(() => {
	vi.restoreAllMocks();
});

/** Runs `getCliArguments` expecting it to call `process.exit`, and returns the exit code. */
function runExpectingExit(argv: string[]): number {
	try {
		getCliArguments(argv);
	} catch (error) {
		if (error instanceof ProcessExit) return error.code;
		throw error;
	}
	throw new Error("expected getCliArguments to exit");
}

describe("getCliArguments", () => {
	it("returns an empty flag set and no command for no arguments", () => {
		expect(getCliArguments([])).toStrictEqual({ input: [], flags: {} });
	});

	it("reads the command from the first positional", () => {
		expect(getCliArguments(["inspect-version"]).input).toStrictEqual(["inspect-version"]);
	});

	it("camel-cases long flags", () => {
		const { flags } = getCliArguments([
			"--dry-run",
			"--skip-bump",
			"--as-json",
			"--commit-url-format",
			"https://example.com/{{hash}}",
		]);

		expect(flags).toMatchObject({
			dryRun: true,
			skipBump: true,
			asJson: true,
			commitUrlFormat: "https://example.com/{{hash}}",
		});
	});

	it("accepts string values with a space or an equals sign", () => {
		expect(getCliArguments(["--release-as", "minor"]).flags.releaseAs).toBe("minor");
		expect(getCliArguments(["--release-as=patch"]).flags.releaseAs).toBe("patch");
	});

	it("negates boolean flags with --no-", () => {
		expect(getCliArguments(["--no-git-tag-fallback"]).flags.gitTagFallback).toBe(false);
		expect(getCliArguments(["--git-tag-fallback"]).flags.gitTagFallback).toBe(true);
	});

	it("folds a trailing true/false into the boolean flag instead of leaving a positional", () => {
		const enabled = getCliArguments(["--debug", "true"]);
		expect(enabled.flags.debug).toBe(true);
		expect(enabled.input).toStrictEqual([]);

		const disabled = getCliArguments(["--debug", "false"]);
		expect(disabled.flags.debug).toBe(false);
		expect(disabled.input).toStrictEqual([]);

		expect(getCliArguments(["--debug=true"]).flags.debug).toBe(true);
		expect(getCliArguments(["--debug=false"]).flags.debug).toBe(false);
	});

	it("keeps a command positional that follows a bare boolean flag", () => {
		const { flags, input } = getCliArguments(["--debug", "inspect"]);
		expect(flags.debug).toBe(true);
		expect(input).toStrictEqual(["inspect"]);
	});

	it("does not treat a value after a string flag as a boolean literal", () => {
		expect(getCliArguments(["--changelog", "false"]).flags.changelog).toBe("false");
	});

	it("omits flags the user did not pass", () => {
		const { flags } = getCliArguments(["--dry-run"]);

		expect(flags).toStrictEqual({ dryRun: true });
		expect("silent" in flags).toBe(false);
	});

	it("supports the short flags", () => {
		const { flags } = getCliArguments(["-F", "a.json", "-G", "*.json", "-P", "./pkg"]);

		expect(flags).toMatchObject({ files: ["a.json"], glob: "*.json", path: "./pkg" });
	});

	it("folds the --file alias into --files", () => {
		expect(getCliArguments(["--file", "a.json", "--files", "b.json"]).flags.files).toStrictEqual([
			"b.json",
			"a.json",
		]);
		expect(getCliArguments(["--file", "only.json"]).flags.files).toStrictEqual(["only.json"]);
	});

	it("prints help and exits 0 for --help", () => {
		expect(runExpectingExit(["--help"])).toBe(0);
		expect(stdout).toHaveBeenCalledWith(expect.stringContaining("Usage:"));
	});

	it("prints the version and exits 0 for --version", () => {
		expect(runExpectingExit(["--version"])).toBe(0);
		expect(stdout).toHaveBeenCalledWith(expect.stringMatching(/^\d+\.\d+\.\d+/));
	});

	it("prints help to stderr and exits 2 for an unknown flag", () => {
		expect(runExpectingExit(["--does-not-exist"])).toBe(2);
		expect(stderr).toHaveBeenCalledWith(expect.stringContaining("Usage:"));
	});

	it("exits 2 when a value-taking flag is negated", () => {
		expect(runExpectingExit(["--no-release-as"])).toBe(2);
	});
});

describe("helperText", () => {
	// Deprecated aliases that are intentionally undocumented.
	const UNDOCUMENTED = new Set(["inspect-version", "release-commit-message-format"]);
	// `--files` is documented via its `--file` alias.
	const DOCUMENTED_VIA_ALIAS = new Set(["files"]);

	it("documents every derived CLI flag", () => {
		const missing = Object.keys(deriveParseArgsOptions()).filter(
			(flag) =>
				!UNDOCUMENTED.has(flag) &&
				!DOCUMENTED_VIA_ALIAS.has(flag) &&
				!helperText.includes(`--${flag}`),
		);

		expect(missing).toStrictEqual([]);
	});
});
