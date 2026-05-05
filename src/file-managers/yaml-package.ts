import { readFile, writeFile } from "node:fs/promises";
import { parse, parseDocument } from "yaml";

import {
	MissingPropertyException,
	type FileState,
	type IFileManager,
} from "../services/file-manager";

/**
 * A yaml package file should have a version property on the top level, like what can be seen
 * in [this example project](https://github.com/eglavin/wordionary/blob/01ae9b9d604cecdf9d320ed6028a727be5e5349e/pubspec.yaml#L19C1-L19C17).
 *
 * @example
 * ```yaml
 * name: wordionary
 * description: "A Flutter project."
 * publish_to: 'none'
 * version: 1.2.3
 * ```
 */
export class YAMLPackage implements IFileManager {
	async read(filePath: string): Promise<FileState | undefined> {
		const fileContents = await readFile(filePath, "utf8");

		const fileVersion = parse(fileContents)?.version;
		if (fileVersion) {
			return {
				path: filePath,
				version: fileVersion,
			};
		}

		throw new MissingPropertyException("YAML", "version");
	}

	async write(fileState: FileState, newVersion: string): Promise<void> {
		const fileContents = await readFile(fileState.path, "utf8");
		const yamlDocument = parseDocument(fileContents);

		yamlDocument.set("version", newVersion);

		await writeFile(fileState.path, yamlDocument.toString(), "utf8");
	}

	isSupportedFile(fileName: string): boolean {
		return fileName.endsWith(".yaml") || fileName.endsWith(".yml");
	}
}
