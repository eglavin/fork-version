// @ts-nocheck

import { readFile, writeFile } from "node:fs/promises";
import { defineFileManager, MissingPropertyException, type FileState } from "fork-version";

export const customFileManager = defineFileManager({
	read: async (filePath) => {
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
	},

	write: async (fileState, newVersion) => {
		const fileContent = await readFile(fileState.path, "utf8");

		if (fileContent) {
			const parsedContent = JSON.parse(fileContent);

			if ("package" in parsedContent && "version" in parsedContent.package) {
				parsedContent.package.version = newVersion;

				const updatedContent = JSON.stringify(parsedContent, null, 2);
				await writeFile(fileState.path, updatedContent, "utf8");
			}
		}
	},

	isSupportedFile: (fileName) => {
		return fileName.endsWith("my-json-file.json");
	},
});
