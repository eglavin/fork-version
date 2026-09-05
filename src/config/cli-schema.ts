import { toKebabCase } from "../utils/case-transform";
import { ZOD_WRAPPER_TYPES } from "./constants";
import { cliOptionRegistry, ForkConfigJSONSchema, WriterOptionsSchema } from "./schema";

export interface ParseArgsOption {
	type: "string" | "boolean";
	multiple?: boolean;
	short?: string;
}

export type ParseArgsOptions = Record<string, ParseArgsOption>;

interface ZodDef {
	type: string;
	innerType?: unknown;
	element?: unknown;
	options?: unknown[];
	values?: unknown[];
}

function defOf(schema: unknown): ZodDef {
	return (schema as { _zod: { def: ZodDef } })._zod.def;
}

type ScalarKind = "string" | "boolean" | "array";

/**
 * Reduces a Zod schema to the `parseArgs` value kind it maps onto, unwrapping
 * `optional` / `default` / etc. Returns `undefined` for anything that isn't a string, boolean,
 * string-literal union, or array-of-strings (objects, functions, mixed unions - all file-only).
 */
function scalarKind(schema: unknown): ScalarKind | undefined {
	let def = defOf(schema);
	while (def.innerType && ZOD_WRAPPER_TYPES.has(def.type)) {
		def = defOf(def.innerType);
	}

	switch (def.type) {
		case "string":
			return "string";
		case "boolean":
			return "boolean";
		case "enum":
			return "string";
		case "literal":
			return def.values?.every((value) => typeof value === "string") ? "string" : undefined;
		case "array":
			return def.element && scalarKind(def.element) === "string" ? "array" : undefined;
		case "union":
			return def.options?.every((option) => scalarKind(option) === "string") ? "string" : undefined;
		default:
			return undefined;
	}
}

function optionFor(kind: ScalarKind, meta?: { short?: string }): ParseArgsOption {
	const option: ParseArgsOption = {
		type: kind === "boolean" ? "boolean" : "string",
	};

	if (kind === "array") option.multiple = true;
	if (meta?.short) option.short = meta.short;

	return option;
}

/**
 * Builds the `options` object for `node:util`'s `parseArgs` from {@link ForkConfigJSONSchema}
 * and {@link WriterOptionsSchema} zod schema's.
 */
export function deriveParseArgsOptions(): ParseArgsOptions {
	/**
	 * CLI flags that cannot be derived from `ForkConfigJSONSchema`:
	 * - `help` / `version` have no config-file equivalent.
	 * - `pre-release` (boolean) and `pre-release-tag` (string) are the two halves of the schema's `preRelease` `string | boolean` union - one flag can't accept both.
	 * - `release-commit-message-format` is a deprecated alias remapped by `./config-compatibility.ts`.
	 */
	const options: ParseArgsOptions = {
		help: { type: "boolean", short: "h" },
		version: { type: "boolean", short: "v" },
		"pre-release": { type: "boolean" },
		"pre-release-tag": { type: "string" },
		"release-commit-message-format": { type: "string" },
	};

	for (const [key, field] of Object.entries(ForkConfigJSONSchema.shape)) {
		const kind = scalarKind(field);
		if (!kind) continue;

		const meta = cliOptionRegistry.get(field);
		if (meta?.hidden) {
			continue;
		}

		options[toKebabCase(key)] = optionFor(kind, meta);

		if (meta?.alias) {
			options[meta.alias] = optionFor(kind);
		}
	}

	for (const key of Object.keys(WriterOptionsSchema.shape)) {
		options[toKebabCase(key)] = { type: "string" };
	}

	return options;
}
