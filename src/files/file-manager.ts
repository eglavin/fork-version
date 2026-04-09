import { isAbsolute, resolve } from "node:path";

import { fileExists } from "../utils/file-state";
import { JSONPackage } from "./json-package";
import { YAMLPackage } from "./yaml-package";
import { PlainText } from "./plain-text";
import { MSBuildProject } from "./ms-build-project";
import { ARMBicep } from "./arm-bicep";
import { InstallShieldISM } from "./install-shield-ism";

import type { ForkConfig } from "../config/types";
import type { Logger } from "../services/logger";

/**
 * Exception thrown if a file manager encounters a file missing a required property,
 * such as the "version" property in a JSON package file.
 */
export class MissingPropertyException extends Error {
	fileType: string;
	propertyName: string;
	constructor(fileType: string, propertyName: string) {
		super(`Missing '${propertyName}' property in ${fileType}`);
		this.name = "MissingPropertyException";
		this.fileType = fileType;
		this.propertyName = propertyName;
	}
}

export interface FileState {
	name: string;
	path: string;
	version: string;

	[other: string]: unknown;
}

export interface IFileManager {
	read(fileName: string): FileState | undefined;
	write(fileState: FileState, newVersion: string): void;
	isSupportedFile(fileName: string): boolean;
}

export class FileManager {
	#config: ForkConfig;
	#logger: Logger;
	#fileManagers: IFileManager[] = [];

	constructor(config: ForkConfig, logger: Logger) {
		this.#config = config;
		this.#logger = logger;
		this.#fileManagers = [
			new JSONPackage(),
			new YAMLPackage(),
			new PlainText(),
			new MSBuildProject(),
			new ARMBicep(),
			new InstallShieldISM(),
		];
	}

	/**
	 * Get the state from the given file name.
	 *
	 * @example
	 * ```ts
	 * fileManager.read("package.json");
	 * ```
	 *
	 * @returns
	 * ```json
	 * { "name": "package.json", "path": "/path/to/package.json", "version": "1.2.3", "isPrivate": true }
	 * ```
	 */
	read(pathOrName: string): FileState | undefined {
		const _fileName = pathOrName.toLowerCase();
		const filePath = isAbsolute(pathOrName) ? pathOrName : resolve(this.#config.path, pathOrName);

		if (!fileExists(filePath)) return;

		for (const fileManager of this.#fileManagers) {
			if (fileManager.isSupportedFile(_fileName)) {
				try {
					return fileManager.read(filePath);
				} catch (error) {
					if (error instanceof MissingPropertyException) {
						this.#logger.warn(
							`[File Manager] Missing '${error.propertyName}' property in ${error.fileType} file: ${_fileName}`,
						);
					} else {
						// Rethrow any unexpected errors.
						throw new Error(`An unexpected error occurred while reading file: ${filePath}`, {
							cause: error,
						});
					}
				}

				return;
			}
		}

		this.#logger.error(`[File Manager] Unsupported file: ${pathOrName}`);
	}

	/**
	 * Write the new version to the given file.
	 *
	 * @example
	 * ```ts
	 * fileManager.write(
	 *   { name: "package.json", path: "/path/to/package.json", version: "1.2.2" },
	 *   "1.2.3"
	 * );
	 * ```
	 */
	write(fileState: FileState, newVersion: string): void {
		if (this.#config.dryRun) {
			return;
		}
		const _fileName = fileState.name.toLowerCase();

		for (const fileManager of this.#fileManagers) {
			if (fileManager.isSupportedFile(_fileName)) {
				return fileManager.write(fileState, newVersion);
			}
		}

		this.#logger.error(`[File Manager] Unsupported file: ${fileState.path}`);
	}
}
