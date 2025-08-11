import { resolve } from "node:path";
import { readFileSync, writeFileSync } from "node:fs";

import { fileExists } from "../utils/file-state";
import type { ForkConfig } from "../config/types";
import type { Logger } from "../utils/logger";
import type { FileState, IFileManager } from "./file-manager";

/**
 * A bicep file with metadata and var called contentVersion defined
 *
 * @example
 * metadata contentVersion = '1.2.3.4'
 * var contentVersion string = '1.2.3.4'
 * ```
 */
export class Bicep implements IFileManager {
    constructor(
        private config: ForkConfig,
        private logger: Logger,
    ) {}

    public read(fileName: string): FileState | undefined {
        const filePath = resolve(this.config.path, fileName);

        if (fileExists(filePath)) {
            const fileContents = readFileSync(filePath, "utf8");

            const metadataMatch = fileContents.match(/metadata\s+contentVersion\s*=\s*['"]([^'"]+)['"]/);
            const varMatch = fileContents.match(/var\s+contentVersion\s+string\s*=\s*['"]([^'"]+)['"]/);
            
            if (metadataMatch && varMatch) {
                
                return {
                    name: fileName,
                    path: filePath,
                    version: metadataMatch[1]
                };
            }
            
            if (!metadataMatch) {
                this.logger.warn(`[File Manager] Missing 'metadata contentVersion' in bicep file: ${fileName}`);
            }
            if (!varMatch) {
                this.logger.warn(`[File Manager] Missing 'var contentVersion' in bicep file: ${fileName}`);
            }
        }

        this.logger.warn(`[File Manager] Unable to determine plain text version: ${fileName}`);
    }

    public write(fileState: FileState, newVersion: string) {
        let fileContents = readFileSync(fileState.path, "utf8");

        const updatedContent = fileContents
            .replace(/(metadata\s+contentVersion\s*=\s*)['"][^'"]+['"]/, `$1'${newVersion}'`)
            .replace(/(var\s+contentVersion(?:\s+string)?\s*=\s*)['"][^'"]+['"]/, `$1'${newVersion}'`);
        
        writeFileSync(fileState.path, updatedContent, "utf8");
    }

    public isSupportedFile(fileName: string): boolean {
        return fileName.endsWith(".bicep");
    }
}
