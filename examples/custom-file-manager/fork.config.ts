// @ts-nocheck

import { defineConfig } from "fork-version";

import { CustomFileManager } from "./custom-file-manager-class";
import { customFileManager } from "./custom-file-manager-function";

export default defineConfig({
	customFileManagers: [new CustomFileManager(), customFileManager],
});
