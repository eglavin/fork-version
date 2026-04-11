import { isAbsolute, relative, resolve } from "node:path";

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
	path: string;
	version: string;
	[other: string]: unknown;
}

export interface IFileManager {
	/**
	 * Function to read the file and return its current state.
	 * @param filePath The path of the file to read, can be either an absolute path or a file name relative to the config path.
	 * @returns The state of the file, including its current version and any other relevant information.
	 * @throws {MissingPropertyException} If the file is missing a required property.
	 * @throws {Error} If an unexpected error occurs while reading the file.
	 *
	 * @example
	 * ```ts
	 * const fileState = await fileManager.read("package.json");
	 *
	 * // Returns
	 * { path: "package.json", version: "1.2.3" }
	 * ```
	 */
	read(filePath: string): Promise<FileState | undefined>;
	/**
	 * Function to write the new version to the file.
	 * @param fileState The current state of the file, including its path and current version.
	 * @param newVersion The new version string to write to the file.
	 *
	 * @example
	 * ```ts
	 * await fileManager.write(
	 *   { path: "package.json", version: "1.2.2" },
	 *   "1.2.3"
	 * );
	 * ```
	 */
	write(fileState: FileState, newVersion: string): Promise<void>;
	/**
	 * Determine if the file manager supports the given file based on its name or path.
	 * File name will be transformed to lower case before checking for support to allow for case-insensitive file matching.
	 * @param filePath The name or path of the file to check.
	 * @returns `true` if the file is supported by this file manager, `false` otherwise.
	 *
	 * @example
	 * ```ts
	 * fileManager.isSupportedFile("package.json");
	 * ```
	 */
	isSupportedFile(filePath: string): boolean;
}

export class FileManager {
	#config: ForkConfig;
	#logger: Logger;
	#fileManagers: IFileManager[] = [];

	constructor(config: ForkConfig, logger: Logger) {
		this.#config = config;
		this.#logger = logger;

		const builtinFileManagers: IFileManager[] = [
			new JSONPackage(),
			new YAMLPackage(),
			new PlainText(),
			new MSBuildProject(),
			new ARMBicep(),
			new InstallShieldISM(),
		];

		// If the user has defined custom file managers place them before the built-in file managers to
		// allow for overriding support for specific files.
		if (config.customFileManagers) {
			this.#fileManagers = [...config.customFileManagers, ...builtinFileManagers];
		} else {
			this.#fileManagers = builtinFileManagers;
		}
	}

	/**
	 * Get the state from the given file.
	 *
	 * @example
	 * ```ts
	 * fileManager.read("package.json");
	 *
	 * // Returns
	 * { path: "package.json", version: "1.2.3" }
	 * ```
	 */
	async read(pathOrName: string): Promise<FileState | undefined> {
		const filePath = isAbsolute(pathOrName) ? pathOrName : resolve(this.#config.path, pathOrName);
		const relativePath = relative(this.#config.path, filePath);
		const fileNameLower = relativePath.toLocaleLowerCase();

		if (!fileExists(filePath)) {
			return;
		}

		for (const fileManager of this.#fileManagers) {
			if (fileManager.isSupportedFile(fileNameLower)) {
				try {
					return await fileManager.read(filePath);
				} catch (error) {
					if (error instanceof MissingPropertyException) {
						this.#logger.warn(
							`[File Manager] Missing '${error.propertyName}' property in ${error.fileType} file: ${relativePath}`,
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

		this.#logger.error(`[File Manager] Unsupported file: ${relativePath}`);
	}

	/**
	 * Write new version to the given file.
	 *
	 * @example
	 * ```ts
	 * fileManager.write(
	 *   { path: "package.json", version: "1.2.2" },
	 *   "1.2.3"
	 * );
	 * ```
	 */
	async write(fileState: FileState, newVersion: string): Promise<void> {
		if (this.#config.dryRun) {
			return;
		}
		const relativePath = relative(this.#config.path, fileState.path);
		const fileNameLower = relativePath.toLocaleLowerCase();

		for (const fileManager of this.#fileManagers) {
			if (fileManager.isSupportedFile(fileNameLower)) {
				return await fileManager.write(fileState, newVersion);
			}
		}

		this.#logger.error(`[File Manager] Unsupported file: ${relativePath}`);
	}
}
