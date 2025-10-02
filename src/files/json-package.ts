import { resolve } from "node:path";
import { readFileSync, writeFileSync } from "node:fs";
import {
	applyEdits,
	type JSONPath,
	modify,
	parse,
	type ParseError,
	type ParseOptions,
} from "jsonc-parser";

import { fileExists } from "../utils/file-state";
import type { ForkConfig } from "../config/types";
import type { Logger } from "../services/logger";
import type { FileState, IFileManager } from "./file-manager";

/** The things we are interested in, in package.json-like files. */
interface PackageJsonish {
	version?: string;
	private?: unknown;
	packages?: {
		""?: {
			version?: string;
		};
	};
}

/**
 * A json package file should have a version property, like what can be seen
 * in the package.json file in the root of this project.
 *
 * @example
 * ```json
 * {
 *   "name": "fork-version",
 *   "version": "1.2.3",
 *   "private": true,
 * }
 * ```
 */
export class JSONPackage implements IFileManager {
	constructor(
		private config: ForkConfig,
		private logger: Logger,
	) {}

	/** Options for parsing JSON and JSONC files. */
	private PARSE_OPTIONS: ParseOptions = {
		allowEmptyContent: false,
		allowTrailingComma: true,
		disallowComments: false,
	};

	/**
	 * Sets a new string value at the given path in a JSON or JSONC string.
	 * @param jsonc the JSON or JSONC string (the contents of a file)
	 * @param jsonPath path to the value to set, as an array of segments
	 * @param newString string to set the value to
	 * @returns the JSON or JSONC string with the value set
	 */
	private setStringInJsonc(jsonc: string, jsonPath: JSONPath, newString: string): string {
		const edits = modify(jsonc, jsonPath, newString, {});
		return applyEdits(jsonc, edits);
	}

	public read(fileName: string): FileState | undefined {
		const filePath = resolve(this.config.path, fileName);

		if (fileExists(filePath)) {
			const fileContents = readFileSync(filePath, "utf8");

			const parseErrors: ParseError[] = [];
			const parsedJson: PackageJsonish = parse(fileContents, parseErrors, this.PARSE_OPTIONS);
			if (parseErrors.length) {
				this.logger.warn(`[File Manager] Unable to parse JSON: ${fileName}`, parseErrors);
				return undefined;
			}

			if (parsedJson?.version) {
				return {
					name: fileName,
					path: filePath,
					version: parsedJson.version,

					isPrivate: typeof parsedJson?.private === "boolean" ? parsedJson.private : true,
				};
			}

			this.logger.warn(`[File Manager] Unable to determine json version: ${fileName}`);
		}
	}

	public write(fileState: FileState, newVersion: string) {
		let fileContents = readFileSync(fileState.path, "utf8");

		const parseErrors: ParseError[] = [];
		const parsedJson: PackageJsonish = parse(fileContents, parseErrors, this.PARSE_OPTIONS);
		if (parseErrors.length) {
			this.logger.warn(`[File Manager] Unable to parse JSON: ${fileState.path}`, parseErrors);
			return;
		}

		fileContents = this.setStringInJsonc(fileContents, ["version"], newVersion);
		if (parsedJson?.packages?.[""]) {
			// package-lock v2 stores version here too.
			fileContents = this.setStringInJsonc(fileContents, ["packages", "", "version"], newVersion);
		}

		writeFileSync(fileState.path, fileContents, "utf8");
	}

	public isSupportedFile(fileName: string): boolean {
		return fileName.endsWith(".json") || fileName.endsWith(".jsonc");
	}
}
