import { basename } from "node:path";
import { readFileSync, writeFileSync } from "node:fs";

import type { Logger } from "../services/logger";
import type { FileState, IFileManager } from "./file-manager";

/**
 * A plain text file will have just the version as the content.
 *
 * @example
 * ```txt
 * 1.2.3
 * ```
 */
export class PlainText implements IFileManager {
	#logger: Logger;

	constructor(logger: Logger) {
		this.#logger = logger;
	}

	read(filePath: string): FileState | undefined {
		const fileName = basename(filePath);
		const fileContents = readFileSync(filePath, "utf8").trim();

		if (fileContents) {
			return {
				name: fileName,
				path: filePath,
				version: fileContents,
			};
		}

		this.#logger.warn(`[File Manager] Unable to determine plain text version: ${fileName}`);
	}

	write(fileState: FileState, newVersion: string) {
		writeFileSync(fileState.path, newVersion, "utf8");
	}

	isSupportedFile(fileName: string): boolean {
		return fileName.endsWith("version.txt");
	}
}
