import { setupTest } from "../../../tests/setup-tests";
import { loadConfigFile } from "../load-config";

describe("load-config", async () => {
	it("should return empty object if no config file found", async () => {
		const { testFolder } = await setupTest("load-config");

		await expect(loadConfigFile(testFolder)).resolves.toStrictEqual({});
	});

	it("should load fork.config.ts", async () => {
		const { create, testFolder } = await setupTest("load-config");

		create.file(`export default { commitAll: true };`, "fork.config.ts");

		await expect(loadConfigFile(testFolder)).resolves.toStrictEqual({ commitAll: true });
	});

	it("should load fork.config.cjs", async () => {
		const { create, testFolder } = await setupTest("load-config");

		create.file(`module.exports = { commitAll: true };`, "fork.config.cjs");

		await expect(loadConfigFile(testFolder)).resolves.toStrictEqual({ commitAll: true });
	});

	it("should validate fork.config.ts", async () => {
		const { create, testFolder } = await setupTest("load-config");

		create.file(`export default { commitAll: "true" };`, "fork.config.ts");

		await expect(loadConfigFile(testFolder)).rejects.toThrow(/^Validation error in: /);
	});

	it("should load fork.config.json", async () => {
		const { create, testFolder } = await setupTest("load-config");

		create.json({ commitAll: true }, "fork.config.json");

		await expect(loadConfigFile(testFolder)).resolves.toStrictEqual({ commitAll: true });
	});

	it("should validate fork.config.json", async () => {
		const { create, testFolder } = await setupTest("load-config");

		create.json({ commitAll: "true" }, "fork.config.json");

		await expect(loadConfigFile(testFolder)).rejects.toThrow(/^Validation error in: /);
	});

	it("should ignore a package.json file without config", async () => {
		const { create, testFolder } = await setupTest("load-config");

		create.json({}, "package.json");

		await expect(loadConfigFile(testFolder)).resolves.toStrictEqual({});
	});

	it("should load package.json", async () => {
		const { create, testFolder } = await setupTest("load-config");

		create.json({ "fork-version": { commitAll: true } }, "package.json");

		await expect(loadConfigFile(testFolder)).resolves.toStrictEqual({ commitAll: true });
	});

	it("should validate package.json", async () => {
		const { create, testFolder } = await setupTest("load-config");

		create.json(
			{
				"fork-version": {
					commitAll: "true",
				},
			},
			"package.json",
		);

		await expect(loadConfigFile(testFolder)).rejects.toThrow(/^Validation error in: /);
	});

	it("should load config from a parent directory", async () => {
		const { create, relativeTo } = await setupTest("load-config");

		create.json({ commitAll: true }, "fork.config.json");
		create.directory("sub-folder");
		create.directory("sub-folder", "sub-folder-2");
		create.file(`v1.2.3`, "sub-folder", "sub-folder-2", "my-version.txt");

		await expect(loadConfigFile(relativeTo("sub-folder", "sub-folder-2"))).resolves.toStrictEqual({
			commitAll: true,
		});
	});

	it("should load a single config file", async () => {
		const { create, testFolder } = await setupTest("load-config");

		create.file(`export default { files: ["file1.js"] };`, "fork.config.ts");
		create.file(`export default { files: ["file2.js"] };`, "fork.config.js");
		create.json({ files: ["file3.js"] }, "fork.config.json");
		create.json({ files: ["file4.js"] }, "package.json");

		await expect(loadConfigFile(testFolder)).resolves.toStrictEqual({ files: ["file1.js"] });
	});
});
