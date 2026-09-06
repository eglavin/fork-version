import { readFile, writeFile } from "node:fs/promises";

import {
	MissingPropertyException,
	type FileState,
	type IFileManager,
} from "../services/file-manager";
import { extractPrerelease } from "../utils/extract-prerelease";
import {
	applyEdits,
	findChildren,
	insertAfter,
	parseMarkup,
	escapeText,
	removeElement,
	replaceText,
	textOf,
	type MarkupEdit,
} from "../utils/xml-document";
import type { Document, Element } from "domhandler";

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
	/**
	 * Collect a property from every PropertyGroup in the project, in document order.
	 *
	 * Projects commonly declare more than one PropertyGroup - a general one alongside a
	 * configuration specific `<PropertyGroup Condition="...">` - and the version can live in any
	 * of them, so every group has to be searched rather than just the first.
	 */
	#findProperties(document: Document, name: string): Element[] {
		return findChildren(document, "Project")
			.flatMap((project) => findChildren(project, "PropertyGroup"))
			.flatMap((propertyGroup) => findChildren(propertyGroup, name));
	}

	async read(filePath: string): Promise<FileState | undefined> {
		const fileContents = await readFile(filePath, "utf8");
		const document = parseMarkup(fileContents);

		// A well formed project declares each property once. If one has been duplicated across
		// PropertyGroups the first is taken as the current version, rather than joining them.
		const version = textOf(this.#findProperties(document, "Version")[0]);
		if (version) {
			return {
				path: filePath,
				version: version,
			};
		}

		const versionPrefix = textOf(this.#findProperties(document, "VersionPrefix")[0]);
		const versionSuffix = textOf(this.#findProperties(document, "VersionSuffix")[0]);
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
		const document = parseMarkup(fileContents);
		const edits: MarkupEdit[] = [];

		// Where a property has been duplicated every copy is updated, so the project doesn't end
		// up with PropertyGroups disagreeing about the version.
		const versions = this.#findProperties(document, "Version");
		if (versions.length) {
			edits.push(...versions.map((version) => replaceText(fileContents, version, newVersion)));
		} else {
			const versionPrefixes = this.#findProperties(document, "VersionPrefix");
			const versionSuffixes = this.#findProperties(document, "VersionSuffix");

			if (versionPrefixes.length) {
				const { prefix, suffix } = extractPrerelease(newVersion);

				edits.push(
					...versionPrefixes.map((versionPrefix) =>
						replaceText(fileContents, versionPrefix, prefix),
					),
				);

				// Depending of if there is a suffix in the new version, we either need to update,
				// add or remove the VersionSuffix property.
				if (suffix) {
					if (versionSuffixes.length) {
						edits.push(
							...versionSuffixes.map((versionSuffix) =>
								replaceText(fileContents, versionSuffix, suffix),
							),
						);
					} else {
						edits.push(
							...versionPrefixes.map((versionPrefix) =>
								insertAfter(
									fileContents,
									versionPrefix,
									`<VersionSuffix>${escapeText(suffix)}</VersionSuffix>`,
								),
							),
						);
					}
				} else {
					edits.push(
						...versionSuffixes.map((versionSuffix) => removeElement(fileContents, versionSuffix)),
					);
				}
			}
		}

		await writeFile(fileState.path, applyEdits(fileContents, edits), "utf8");
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
