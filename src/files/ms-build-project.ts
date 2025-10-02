import { resolve } from "node:path";
import { readFileSync, writeFileSync } from "node:fs";
import * as cheerio from "cheerio/slim";

import { fileExists } from "../utils/file-state";
import type { ForkConfig } from "../config/types";
import type { Logger } from "../services/logger";
import type { FileState, IFileManager } from "./file-manager";

/**
 * A ms-build file is an xml file with a version property under the Project > PropertyGroup node.
 *
 * [Microsoft Learn - MSBuild Reference](https://learn.microsoft.com/en-us/visualstudio/msbuild/msbuild?view=vs-2022)
 *
 * @example
 * ```xml
 * <Project Sdk="Microsoft.NET.Sdk">
 *   <PropertyGroup>
 *     <Version>1.2.3</Version>
 *   </PropertyGroup>
 * </Project>
 * ```
 */
export class MSBuildProject implements IFileManager {
	constructor(
		private config: ForkConfig,
		private logger: Logger,
	) {}

	public read(fileName: string): FileState | undefined {
		const filePath = resolve(this.config.path, fileName);

		if (fileExists(filePath)) {
			const fileContents = readFileSync(filePath, "utf8");
			const $ = cheerio.load(fileContents, {
				xmlMode: true,
				xml: { decodeEntities: false },
			});

			const version = $("Project > PropertyGroup > Version").text();
			if (version) {
				return {
					name: fileName,
					path: filePath,
					version: version,
				};
			}

			this.logger.warn(`[File Manager] Unable to determine ms-build version: ${fileName}`);
		}
	}

	public write(fileState: FileState, newVersion: string) {
		const fileContents = readFileSync(fileState.path, "utf8");
		const $ = cheerio.load(fileContents, {
			xmlMode: true,
			xml: { decodeEntities: false },
		});

		$("Project > PropertyGroup > Version").text(newVersion);

		// Cheerio doesn't handle self-closing tags well,
		// so we're manually adding a space before the closing tag.
		const updatedContent = $.xml().replaceAll('"/>', '" />');

		writeFileSync(fileState.path, updatedContent, "utf8");
	}

	public isSupportedFile(fileName: string): boolean {
		// List of known ms-build project file extensions.
		// https://stackoverflow.com/questions/2007689/is-there-a-standard-file-extension-for-msbuild-files
		return (
			[".csproj", ".dbproj", ".esproj", ".fsproj", ".props", ".vbproj", ".vcxproj"].findIndex(
				(ext) => fileName.endsWith(ext),
			) !== -1
		);
	}
}
