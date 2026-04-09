import { basename } from "node:path";
import { readFileSync, writeFileSync } from "node:fs";

import { MissingPropertyException, type FileState, type IFileManager } from "./file-manager";

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

	read(filePath: string): FileState | undefined {
		const fileName = basename(filePath);
		const fileContents = readFileSync(filePath, "utf8");

		const metadataMatch = this.#metadataRegex.exec(fileContents);

		if (metadataMatch?.groups?.version) {
			return {
				name: fileName,
				path: filePath,
				version: metadataMatch.groups.version,
			};
		}

		throw new MissingPropertyException("ARM Bicep", "metadata contentVersion");
	}

	write(fileState: FileState, newVersion: string) {
		const fileContents = readFileSync(fileState.path, "utf8");

		const updatedContent = fileContents
			.replace(this.#metadataRegex, `$1${newVersion}$3`)
			.replace(this.#varRegex, `$1${newVersion}$3`);

		writeFileSync(fileState.path, updatedContent, "utf8");
	}

	isSupportedFile(fileName: string): boolean {
		return fileName.endsWith(".bicep");
	}
}
