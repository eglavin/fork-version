import type { IFileManager } from "../services/file-manager";

/**
 * Optional helper function to enable intellisense and type checking when defining a custom file manager.
 *
 * [Fork-Version - Custom File Managers](https://github.com/eglavin/fork-version/blob/main/docs/Supported-File-Managers.md#custom-file-updaters)
 *
 *
 * @example
 * ```ts
 * // File: fork.config.ts
 * import { defineFileManager } from "fork-version";
 *
 * const myFileManager = defineFileManager({
 *   async read(filePath) {
 *     // Logic to read the file and extract the version.
 *     return {
 *       path: "/path/to/file",
 *       version: "1.2.3",
 *     };
 *   },
 *   async write(fileState, newVersion) {
 *     // Logic to write the updated version.
 *   },
 *   isSupportedFile(fileName) {
 *     // Logic to determine if the file is supported by this file manager.
 *     return fileName.endsWith(".custom");
 *   },
 * });
 *
 * export default {
 *   customFileManagers: [myFileManager],
 * }
 * ```
 *
 * @param fileManager The custom file manager to be defined.
 * @returns The same file manager object that was passed in.
 */
export function defineFileManager(fileManager: IFileManager): IFileManager {
	return fileManager;
}
