import { resolve } from "node:path";
import { readFileSync, writeFileSync } from "node:fs";

import { fileExists } from "../utils/file-state";
import type { ForkConfig } from "../config/types";
import type { Logger } from "../services/logger";
import type { FileState, IFileManager } from "./file-manager";

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
	constructor(
		private config: ForkConfig,
		private logger: Logger,
	) {}

	/** https://regex101.com/r/Lriphb/2 */
	private metadataRegex = /(metadata contentVersion *= *['"])(?<version>[^'"]+)(['"])/;

	/** https://regex101.com/r/iKCTF9/1 */
	private varRegex = /(var contentVersion(?: string)? *= *['"])(?<version>[^'"]+)(['"])/;

	public read(fileName: string): FileState | undefined {
		const filePath = resolve(this.config.path, fileName);

		if (fileExists(filePath)) {
			const fileContents = readFileSync(filePath, "utf8");

			const metadataMatch = this.metadataRegex.exec(fileContents);
			const varMatch = this.varRegex.exec(fileContents);

			if (metadataMatch?.groups?.version && varMatch?.groups?.version) {
				return {
					name: fileName,
					path: filePath,
					version: metadataMatch.groups.version,
				};
			}

			if (!metadataMatch) {
				this.logger.warn(
					`[File Manager] Missing 'metadata contentVersion' in bicep file: ${fileName}`,
				);
			}
			if (!varMatch) {
				this.logger.warn(`[File Manager] Missing 'var contentVersion' in bicep file: ${fileName}`);
			}
		}
	}

	public write(fileState: FileState, newVersion: string) {
		const fileContents = readFileSync(fileState.path, "utf8");

		const updatedContent = fileContents
			.replace(this.metadataRegex, `$1${newVersion}$3`)
			.replace(this.varRegex, `$1${newVersion}$3`);

		writeFileSync(fileState.path, updatedContent, "utf8");
	}

	public isSupportedFile(fileName: string): boolean {
		return fileName.endsWith(".bicep");
	}
}
