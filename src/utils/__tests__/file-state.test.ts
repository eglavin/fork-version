import { resolve } from "node:path";

import { fileExists } from "../file-state";

describe("file-state", () => {
	it("should determine this file exists", () => {
		expect(fileExists(resolve(import.meta.dirname, import.meta.filename))).toBe(true);
	});

	it("should determine this file does not exist", () => {
		expect(fileExists(resolve(import.meta.dirname, "non-existent-file"))).toBe(false);
	});
});
