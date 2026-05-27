import { readFile, writeFile } from "node:fs/promises";
import * as cheerio from "cheerio/slim";

import {
	MissingPropertyException,
	type FileState,
	type IFileManager,
} from "../services/file-manager";
import { extractPrerelease } from "../utils/extract-prerelease";

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
 *
 * ms-build projects can also use VersionPrefix and VersionSuffix properties instead of Version, in
 * which case the full version is determined by concatenating the prefix and suffix.
 *
 * @example
 * ```xml
 * <Project Sdk="Microsoft.NET.Sdk">
 *   <PropertyGroup>
 *     <VersionPrefix>1.2.3</VersionPrefix>
 *     <VersionSuffix>beta.1</VersionSuffix>
 *   </PropertyGroup>
 * </Project>
 * ```
 */
export class MSBuildProject implements IFileManager {
	#cheerioOptions: cheerio.CheerioOptions = {
		xmlMode: true,
		xml: { decodeEntities: false },
	};

	async read(filePath: string): Promise<FileState | undefined> {
		const fileContents = await readFile(filePath, "utf8");

		const $ = cheerio.load(fileContents, this.#cheerioOptions);

		const version = $("Project > PropertyGroup > Version").text();
		if (version) {
			return {
				path: filePath,
				version: version,
			};
		}

		const versionPrefix = $("Project > PropertyGroup > VersionPrefix").text();
		const versionSuffix = $("Project > PropertyGroup > VersionSuffix").text();
		if (versionPrefix) {
			return {
				path: filePath,
				version: versionSuffix ? `${versionPrefix}-${versionSuffix}` : versionPrefix,
			};
		}

		throw new MissingPropertyException("MSBuild", "Version");
	}

	async write(fileState: FileState, newVersion: string): Promise<void> {
		const fileContents = await readFile(fileState.path, "utf8");

		const $ = cheerio.load(fileContents, this.#cheerioOptions);

		const version = $("Project > PropertyGroup > Version");
		if (version.length) {
			version.text(newVersion);
		} else {
			const versionPrefix = $("Project > PropertyGroup > VersionPrefix");
			const versionSuffix = $("Project > PropertyGroup > VersionSuffix");

			if (versionPrefix.length) {
				const { prefix, suffix } = extractPrerelease(newVersion);

				versionPrefix.text(prefix);

				// Depending of if there is a suffix in the new version, we either need to update,
				// add or remove the VersionSuffix property.
				if (suffix) {
					if (versionSuffix.length) {
						versionSuffix.text(suffix);
					} else {
						$(`\n<VersionSuffix>${suffix}</VersionSuffix>`).insertAfter(versionPrefix);
					}
				} else {
					versionSuffix.remove();
				}
			}
		}

		// Cheerio doesn't handle self-closing tags well,
		// so we're manually adding a space before the closing tag.
		const updatedContent = $.xml().replaceAll('"/>', '" />');

		await writeFile(fileState.path, updatedContent, "utf8");
	}

	isSupportedFile(fileName: string): boolean {
		// List of known ms-build project file extensions.
		// https://stackoverflow.com/questions/2007689/is-there-a-standard-file-extension-for-msbuild-files
		return (
			[".csproj", ".dbproj", ".esproj", ".fsproj", ".props", ".vbproj", ".vcxproj"].findIndex(
				(ext) => fileName.endsWith(ext),
			) !== -1
		);
	}
}
