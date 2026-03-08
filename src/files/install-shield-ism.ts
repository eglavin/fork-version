import { basename } from "node:path";
import { readFileSync, writeFileSync } from "node:fs";
import * as cheerio from "cheerio/slim";

import type { Logger } from "../services/logger";
import type { FileState, IFileManager } from "./file-manager";

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
	#logger: Logger;

	constructor(logger: Logger) {
		this.#logger = logger;
	}

	#cheerioOptions: cheerio.CheerioOptions = {
		xmlMode: true,
		xml: { decodeEntities: false },
	};

	read(filePath: string): FileState | undefined {
		const fileName = basename(filePath);
		const fileContents = readFileSync(filePath, "utf8");

		const $ = cheerio.load(fileContents, this.#cheerioOptions);
		const version = $('msi > table[name="Property"] > row > td:contains("ProductVersion")')
			.next()
			.text()
			.trim();
		if (version) {
			return {
				name: fileName,
				path: filePath,
				version: version,
			};
		}

		this.#logger.warn(`[File Manager] Unable to determine InstallShield ISM version: ${fileName}`);
	}

	write(fileState: FileState, newVersion: string): void {
		const fileContents = readFileSync(fileState.path, "utf8");

		const $ = cheerio.load(fileContents, this.#cheerioOptions);
		const versionCell = $(
			'msi > table[name="Property"] > row > td:contains("ProductVersion")',
		).next();
		if (versionCell.length > 0) {
			versionCell.text(newVersion);
		}

		// Cheerio doesn't handle self-closing tags well,
		// so we're manually adding a space before any closing tags.
		const updatedContent = $.xml().replaceAll('"/>', '" />');

		writeFileSync(fileState.path, updatedContent, "utf8");
	}

	isSupportedFile(fileName: string): boolean {
		return fileName.endsWith(".ism");
	}
}
