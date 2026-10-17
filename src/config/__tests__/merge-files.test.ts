import { DEFAULT_CONFIG } from "../defaults";
import { mergeFiles } from "../merge-files";

describe("mergeFiles", () => {
	it("should handle undefined input", () => {
		expect(mergeFiles(undefined, undefined, [])).toStrictEqual(DEFAULT_CONFIG.files);
		expect(mergeFiles(["file1"], undefined, [])).toStrictEqual(["file1"]);
		expect(mergeFiles(undefined, ["file2"], [])).toStrictEqual(["file2"]);
		expect(mergeFiles(undefined, undefined, ["file3"])).toStrictEqual(["file3"]);
	});

	it("should merge all files", () => {
		expect(mergeFiles(["file1"], ["file2"], ["file3"])).toStrictEqual(["file1", "file2", "file3"]);
	});

	it("should remove duplicates", () => {
		expect(mergeFiles(["file1"], ["file1"], ["file1"])).toStrictEqual(["file1"]);
	});
});
