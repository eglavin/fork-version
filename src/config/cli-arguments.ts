import { parseArgs } from "node:util";

import pkg from "../../package.json" with { type: "json" };
import { helperText } from "./cli-help";
import { deriveParseArgsOptions, normalizeBooleanFlagValues } from "./cli-schema";
import { NON_FLAG_ARG_KEYS } from "./constants";
import { toCamelCase } from "../utils/case-transform";
import type { ForkVersionCLIArgs, ForkVersionCLIFlags } from "./types";

/**
 * Parses the given arguments (defaulting to `process.argv`) into `{ input, flags }` using
 * `node:util`'s `parseArgs`, with the option set derived from the config schema.
 *
 * Handles `--help` / `--version` directly, and exits with code 2 on an un-parseable argument list.
 */
export function getCliArguments(argv: string[] = process.argv.slice(2)): ForkVersionCLIArgs {
	const options = deriveParseArgsOptions();

	let parsed;
	try {
		parsed = parseArgs({
			args: normalizeBooleanFlagValues(argv, options),
			options,
			allowPositionals: true,
			allowNegative: true,
			strict: true,
		});
	} catch (error) {
		process.stderr.write(
			`${error instanceof Error ? error.message : String(error)}\n\n${helperText}\n`,
		);
		return process.exit(2);
	}

	if (parsed.values.help) {
		process.stdout.write(`${helperText}\n`);
		return process.exit(0);
	}
	if (parsed.values.version) {
		process.stdout.write(`${pkg.version}\n`);
		return process.exit(0);
	}

	const flags: Record<string, string | boolean | string[]> = {};

	for (const [key, value] of Object.entries(parsed.values)) {
		if (value === undefined || NON_FLAG_ARG_KEYS.has(key)) continue;
		flags[toCamelCase(key)] = value as string | boolean;
	}

	// Merge files aliases.
	const files = [
		...((parsed.values.files as string[] | undefined) ?? []),
		...((parsed.values.file as string[] | undefined) ?? []),
	];
	if (files.length > 0) {
		flags.files = files;
	}

	return {
		input: parsed.positionals,
		flags: flags as ForkVersionCLIFlags,
	};
}
