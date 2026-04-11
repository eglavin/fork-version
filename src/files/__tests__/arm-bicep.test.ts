import { readFileSync } from "node:fs";

import { setupTest } from "../../../tests/setup-tests";
import { MissingPropertyException } from "../file-manager";
import { ARMBicep } from "../arm-bicep";

describe("files arm-bicep", () => {
	it("should read a bicep file with valid metadata and var contentVersion", async () => {
		const { create, relativeTo } = await setupTest("files arm-bicep");
		const fileManager = new ARMBicep();

		create.file(
			`metadata contentVersion = '1.2.3'
var contentVersion string = '1.2.3'`,
			"deploy.bicep",
		);

		const file = await fileManager.read(relativeTo("deploy.bicep"));
		expect(file?.version).toBe("1.2.3");
	});

	it("should throw an error if metadata contentVersion is missing", async () => {
		const { create, relativeTo } = await setupTest("files arm-bicep");
		const fileManager = new ARMBicep();

		create.file(`var contentVersion string = '1.2.3'`, "deploy.bicep");

		await expect(async () => await fileManager.read(relativeTo("deploy.bicep"))).rejects.toThrow(
			MissingPropertyException,
		);
	});

	it("should write a new version to a bicep file", async () => {
		const { create, relativeTo } = await setupTest("files arm-bicep");
		const fileManager = new ARMBicep();

		create.file(
			`metadata contentVersion = '1.2.3'
var contentVersion string = '1.2.3'

  	// This is a comment that should not be changed
`,
			"deploy.bicep",
		);

		await fileManager.write(
			{
				path: relativeTo("deploy.bicep"),
				version: "1.2.3",
			},
			"4.5.6",
		);

		const content = readFileSync(relativeTo("deploy.bicep"), "utf8");
		expect(content).toBe(
			`metadata contentVersion = '4.5.6'
var contentVersion string = '4.5.6'

  	// This is a comment that should not be changed
`,
		);
	});

	it("should handle spacing around contentVersion", async () => {
		const { create, relativeTo } = await setupTest("files arm-bicep");
		const fileManager = new ARMBicep();

		create.file(
			`metadata contentVersion     ='1.2.3'
var contentVersion string=         "1.2.3"`,
			"deploy.bicep",
		);

		const file = await fileManager.read(relativeTo("deploy.bicep"));
		expect(file?.version).toBe("1.2.3");

		await fileManager.write(
			{
				path: relativeTo("deploy.bicep"),
				version: "1.2.3",
			},
			"2.3.4",
		);

		const content = readFileSync(relativeTo("deploy.bicep"), "utf8");
		expect(content).toBe(
			`metadata contentVersion     ='2.3.4'
var contentVersion string=         "2.3.4"`,
		);
	});

	it("should handle missing type in var declaration", async () => {
		const { create, relativeTo } = await setupTest("files arm-bicep");
		const fileManager = new ARMBicep();

		create.file(
			`metadata contentVersion = '1.2.3'
var contentVersion = '1.2.3'`,
			"deploy.bicep",
		);

		const file = await fileManager.read(relativeTo("deploy.bicep"));
		expect(file?.version).toBe("1.2.3");

		await fileManager.write(
			{
				path: relativeTo("deploy.bicep"),
				version: "1.2.3",
			},
			"2.3.4",
		);

		const content = readFileSync(relativeTo("deploy.bicep"), "utf8");
		expect(content).toBe(
			`metadata contentVersion = '2.3.4'
var contentVersion = '2.3.4'`,
		);
	});

	it("should match bicep files", async () => {
		const fileManager = new ARMBicep();

		// Supported
		expect(fileManager.isSupportedFile("deploy.bicep")).toBe(true);
		expect(fileManager.isSupportedFile("module.bicep")).toBe(true);

		// Not supported
		expect(fileManager.isSupportedFile("deploy.json")).toBe(false);
		expect(fileManager.isSupportedFile("bicep")).toBe(false);
		expect(fileManager.isSupportedFile("deploy.bicep.json")).toBe(false);
	});
});
