import { readFile, writeFile } from "node:fs/promises";

import {
	MissingPropertyException,
	type FileState,
	type IFileManager,
} from "../services/file-manager";

/**
 * A plain text file will have just the version as the content.
 *
 * @example
 * ```txt
 * 1.2.3
 * ```
 */
export class PlainText implements IFileManager {
	async read(filePath: string): Promise<FileState | undefined> {
		const fileContents = (await readFile(filePath, "utf8")).trim();

		if (fileContents) {
			return {
				path: filePath,
				version: fileContents,
			};
		}

		throw new MissingPropertyException("Plain Text", "version");
	}

	async write(fileState: FileState, newVersion: string): Promise<void> {
		await writeFile(fileState.path, newVersion, "utf8");
	}

	isSupportedFile(fileName: string): boolean {
		return fileName.endsWith("version.txt");
	}
}
