import { readFileSync } from "node:fs";

import { setupTest } from "../../../tests/setup-tests";
import { MissingPropertyException } from "../file-manager";
import { PlainText } from "../plain-text";

describe("files plain-text", () => {
	it("should be able to read version from version.txt file", async () => {
		const { create, relativeTo } = await setupTest("files plain-text");
		const fileManager = new PlainText();

		create.file("1.2.3", "version.txt");

		const file = fileManager.read(relativeTo("version.txt"));

		expect(file?.version).toBe("1.2.3");
	});

	it("should throw an error when version.txt is empty", async () => {
		const { create, relativeTo } = await setupTest("files plain-text");
		const fileManager = new PlainText();

		create.file("", "version.txt");

		expect(() => fileManager.read(relativeTo("version.txt"))).toThrow(MissingPropertyException);
	});

	it("should be able to write version to version.txt file", async () => {
		const { create, relativeTo } = await setupTest("files plain-text");
		const fileManager = new PlainText();

		create.file("1.2.3", "version.txt");

		fileManager.write(
			{
				name: "version.txt",
				path: relativeTo("version.txt"),
				version: "1.2.3",
			},
			"1.2.4",
		);
		const newVersion = readFileSync(relativeTo("version.txt"), "utf-8");

		expect(newVersion).toBe("1.2.4");
	});

	it('should match "version.txt" file name', async () => {
		const fileManager = new PlainText();

		// Supported
		expect(fileManager.isSupportedFile("version.txt")).toBe(true);

		// Not supported
		expect(fileManager.isSupportedFile("version.md")).toBe(false);
	});
});
