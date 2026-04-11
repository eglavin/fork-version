import { basename } from "node:path";
import { readFile, writeFile } from "node:fs/promises";
import { parse, parseDocument } from "yaml";

import { MissingPropertyException, type FileState, type IFileManager } from "./file-manager";

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
	/**
	 * If the version is returned with a "+" symbol in the value then the version might be from a
	 * flutter `pubspec.yaml` file, if so we want to retain the input builderNumber by splitting it
	 * and joining it again later.
	 */
	#handleBuildNumber(fileVersion: string): {
		version: string;
		builderNumber?: string;
	} {
		const [version, builderNumber] = fileVersion.split("+");

		// If the builderNumber is an integer then we'll return the split value.
		if (/^\d+$/.test(builderNumber)) {
			return {
				version,
				builderNumber,
			};
		}

		return {
			version: fileVersion,
		};
	}

	async read(filePath: string): Promise<FileState | undefined> {
		const fileContents = await readFile(filePath, "utf8");

		const fileVersion = parse(fileContents)?.version;
		if (fileVersion) {
			const parsedVersion = this.#handleBuildNumber(fileVersion);

			return {
				name: basename(filePath),
				path: filePath,
				version: parsedVersion.version || "",
				builderNumber: parsedVersion.builderNumber ?? undefined,
			};
		}

		throw new MissingPropertyException("YAML", "version");
	}

	async write(fileState: FileState, newVersion: string): Promise<void> {
		const fileContents = await readFile(fileState.path, "utf8");
		const yamlDocument = parseDocument(fileContents);

		let newFileVersion = newVersion;
		if (fileState.builderNumber !== undefined) {
			newFileVersion += `+${fileState.builderNumber}`; // Reattach builderNumber if previously set.
		}

		yamlDocument.set("version", newFileVersion);

		await writeFile(fileState.path, yamlDocument.toString(), "utf8");
	}

	isSupportedFile(fileName: string): boolean {
		return fileName.endsWith(".yaml") || fileName.endsWith(".yml");
	}
}
