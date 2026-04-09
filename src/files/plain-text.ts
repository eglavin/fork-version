import { basename } from "node:path";
import { readFileSync, writeFileSync } from "node:fs";

import { MissingPropertyException, type FileState, type IFileManager } from "./file-manager";

/**
 * A plain text file will have just the version as the content.
 *
 * @example
 * ```txt
 * 1.2.3
 * ```
 */
export class PlainText implements IFileManager {
	read(filePath: string): FileState | undefined {
		const fileContents = readFileSync(filePath, "utf8").trim();

		if (fileContents) {
			return {
				name: basename(filePath),
				path: filePath,
				version: fileContents,
			};
		}

		throw new MissingPropertyException("Plain Text", "version");
	}

	write(fileState: FileState, newVersion: string) {
		writeFileSync(fileState.path, newVersion, "utf8");
	}

	isSupportedFile(fileName: string): boolean {
		return fileName.endsWith("version.txt");
	}
}
