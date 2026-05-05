import { readFile, writeFile } from "node:fs/promises";

import {
	MissingPropertyException,
	type FileState,
	type IFileManager,
} from "../services/file-manager";

/**
 * An ARM bicep file with metadata and variable called contentVersion.
 *
 * @example
 * ```bicep
 * metadata contentVersion = '1.2.3.4'
 * var contentVersion string = '1.2.3.4'
 * ```
 */
export class ARMBicep implements IFileManager {
	/** https://regex101.com/r/Lriphb/2 */
	#metadataRegex = /(metadata contentVersion *= *['"])(?<version>[^'"]+)(['"])/;

	/** https://regex101.com/r/iKCTF9/1 */
	#varRegex = /(var contentVersion(?: string)? *= *['"])(?<version>[^'"]+)(['"])/;

	async read(filePath: string): Promise<FileState | undefined> {
		const fileContents = await readFile(filePath, "utf8");

		const metadataMatch = this.#metadataRegex.exec(fileContents);
		if (metadataMatch?.groups?.version) {
			return {
				path: filePath,
				version: metadataMatch.groups.version,
			};
		}

		throw new MissingPropertyException("ARM Bicep", "metadata contentVersion");
	}

	async write(fileState: FileState, newVersion: string): Promise<void> {
		const fileContents = await readFile(fileState.path, "utf8");

		const updatedContent = fileContents
			.replace(this.#metadataRegex, `$1${newVersion}$3`)
			.replace(this.#varRegex, `$1${newVersion}$3`);

		await writeFile(fileState.path, updatedContent, "utf8");
	}

	isSupportedFile(fileName: string): boolean {
		return fileName.endsWith(".bicep");
	}
}
