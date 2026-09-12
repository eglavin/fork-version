import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

describe("loading without jiti", () => {
	let testFolder: string;

	beforeEach(() => {
		testFolder = mkdtempSync(join(tmpdir(), "fork-version-load-config-"));
		vi.resetModules();
		vi.doMock("jiti", () => {
			throw new Error("jiti must not be loaded");
		});
	});

	afterEach(() => {
		vi.doUnmock("jiti");
		vi.resetModules();
		rmSync(testFolder, { recursive: true, force: true });
	});

	it("should import the public API without loading jiti", async () => {
		await expect(import("../../index")).resolves.toHaveProperty("getNextVersion");
	});

	it("should return empty config without loading jiti", async () => {
		const { loadConfigFile } = await import("../load-config");

		await expect(loadConfigFile(testFolder)).resolves.toStrictEqual({});
	});

	it.each([
		["fork.config.json", { commitAll: true }],
		["package.json", { "fork-version": { commitAll: true } }],
	])("should load %s without loading jiti", async (fileName, config) => {
		writeFileSync(join(testFolder, fileName), JSON.stringify(config), "utf8");
		const { loadConfigFile } = await import("../load-config");

		await expect(loadConfigFile(testFolder)).resolves.toStrictEqual({ commitAll: true });
	});
});
