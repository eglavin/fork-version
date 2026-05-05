import { defineFileManager } from "../define-file-manager";
import type { IFileManager } from "../../files/file-manager";

describe("define-file-manager", () => {
	it("should return the given file manager", () => {
		const TEST_FILE_MANAGER: IFileManager = {
			read: async (filePath) => {
				return {
					path: filePath,
					version: "1.2.3",
				};
			},
			write: async (_fileState, _newVersion) => {
				// no-op
			},
			isSupportedFile: (filePath) => {
				return filePath.endsWith(".test");
			},
		};

		expect(defineFileManager(TEST_FILE_MANAGER)).toStrictEqual(TEST_FILE_MANAGER);
	});
});
