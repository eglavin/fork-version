import type { IFileManager } from "../services/file-manager";

/**
 * Helper function to define a custom file manager with proper typing.
 *
 * [Fork-Version - Custom File Managers](https://github.com/eglavin/fork-version#custom-file-updaters)
 */

export function defineFileManager(fileManager: IFileManager): IFileManager {
	return fileManager;
}
