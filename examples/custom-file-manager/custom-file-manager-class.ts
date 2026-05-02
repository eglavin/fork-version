// @ts-nocheck

import { readFile, writeFile } from "node:fs/promises";
import { MissingPropertyException, type FileState, type IFileManager } from "fork-version";

export class CustomFileManager implements IFileManager {
	async read(filePath: string): Promise<FileState | undefined> {
		const fileContent = await readFile(filePath, "utf8");

		if (fileContent) {
			const parsedContent = JSON.parse(fileContent);

			if ("package" in parsedContent && "version" in parsedContent.package) {
				return {
					path: filePath,
					version: parsedContent.package.version,
				};
			}
		}

		throw new MissingPropertyException("My Custom File", "package.version");
	}

	async write(fileState: FileState, newVersion: string): Promise<void> {
		const fileContent = await readFile(fileState.path, "utf8");

		if (fileContent) {
			const parsedContent = JSON.parse(fileContent);

			if ("package" in parsedContent && "version" in parsedContent.package) {
				parsedContent.package.version = newVersion;

				const updatedContent = JSON.stringify(parsedContent, null, 2);
				await writeFile(fileState.path, updatedContent, "utf8");
			}
		}
	}

	isSupportedFile(fileName: string) {
		return fileName.endsWith("my-json-file.json");
	}
}
