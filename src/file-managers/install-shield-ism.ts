import { readFile, writeFile } from "node:fs/promises";

import {
	MissingPropertyException,
	type FileState,
	type IFileManager,
} from "../services/file-manager";
import { applyEdits, findChildren, parseMarkup, replaceText, textOf } from "../utils/xml-document";
import type { Document, Element } from "domhandler";

/**
 * An InstallShield ISM file can be either XML or binary, only the XML format is supported
 * by this file manager. The XML format typically contains a "Property" table with a
 * "ProductVersion" property.
 *
 * @example
 * ```xml
 * <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
 * <?xml-stylesheet type="text/xsl" href="is.xsl" ?>
 * <!DOCTYPE msi [
 *  ...
 * ]>
 * <msi version="2.0" xmlns:dt="urn:schemas-microsoft-com:datatypes">
 *
 * 	<table name="Property">
 * 		<row><td>ProductVersion</td><td>1.2.3</td><td/></row>
 * 	</table>
 *
 * </msi>
 * ```
 */
export class InstallShieldISM implements IFileManager {
	/**
	 * The cells holding the value of the ProductVersion property.
	 *
	 * Each row of the Property table is a name cell followed by its value cell, so the version is
	 * the cell after the one naming it.
	 */
	#findVersionCells(document: Document): Element[] {
		return findChildren(document, "msi")
			.flatMap((msi) => findChildren(msi, "table"))
			.filter((table) => table.attribs.name === "Property")
			.flatMap((table) => findChildren(table, "row"))
			.flatMap((row) => {
				const cells = findChildren(row, "td");
				const nameCell = cells.findIndex((cell) => textOf(cell).includes("ProductVersion"));

				return nameCell === -1 ? [] : cells.slice(nameCell + 1, nameCell + 2);
			});
	}

	async read(filePath: string): Promise<FileState | undefined> {
		const fileContents = await readFile(filePath, "utf8");
		const document = parseMarkup(fileContents);

		const version = textOf(this.#findVersionCells(document)[0]).trim();
		if (version) {
			return {
				path: filePath,
				version: version,
			};
		}

		throw new MissingPropertyException("InstallShield ISM", "ProductVersion");
	}

	async write(fileState: FileState, newVersion: string): Promise<void> {
		const fileContents = await readFile(fileState.path, "utf8");
		const document = parseMarkup(fileContents);

		const edits = this.#findVersionCells(document).map((versionCell) =>
			replaceText(fileContents, versionCell, newVersion),
		);

		await writeFile(fileState.path, applyEdits(fileContents, edits), "utf8");
	}

	isSupportedFile(fileName: string): boolean {
		return fileName.endsWith(".ism");
	}
}
