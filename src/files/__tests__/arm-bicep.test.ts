import { readFileSync } from "node:fs";

import { setupTest } from "../../../tests/setup-tests";
import { ARMBicep } from "../arm-bicep";

describe("files arm-bicep", () => {
	it("should read a bicep file with valid metadata and var contentVersion", async () => {
		const { config, create, logger } = await setupTest("files arm-bicep");
		const fileManager = new ARMBicep(config, logger);

		create.file(
			`metadata contentVersion = '1.2.3'
var contentVersion string = '1.2.3'`,
			"deploy.bicep",
		);

		const file = fileManager.read("deploy.bicep");
		expect(file?.version).toBe("1.2.3");
	});

	it("should log a warning if metadata contentVersion is missing", async () => {
		const { config, create, logger } = await setupTest("files arm-bicep");
		const fileManager = new ARMBicep(config, logger);

		create.file(`var contentVersion string = '1.2.3'`, "deploy.bicep");

		const file = fileManager.read("deploy.bicep");
		expect(file).toBeUndefined();
		expect(logger.warn).toBeCalledWith(
			"[File Manager] Missing 'metadata contentVersion' in bicep file: deploy.bicep",
		);
	});

	it("should log a warning if var contentVersion is missing", async () => {
		const { config, create, logger } = await setupTest("files arm-bicep");
		const fileManager = new ARMBicep(config, logger);

		create.file(`metadata contentVersion = '1.2.3'`, "deploy.bicep");

		const file = fileManager.read("deploy.bicep");
		expect(file).toBeUndefined();
		expect(logger.warn).toBeCalledWith(
			"[File Manager] Missing 'var contentVersion' in bicep file: deploy.bicep",
		);
	});

	it("should log a warning if unable to determine version", async () => {
		const { config, create, logger } = await setupTest("files arm-bicep");
		const fileManager = new ARMBicep(config, logger);

		create.file(`// This file has no version information`, "deploy.bicep");

		const file = fileManager.read("deploy.bicep");
		expect(file).toBeUndefined();
		expect(logger.warn).toHaveBeenCalledWith(
			"[File Manager] Missing 'metadata contentVersion' in bicep file: deploy.bicep",
		);
		expect(logger.warn).toHaveBeenCalledWith(
			"[File Manager] Missing 'var contentVersion' in bicep file: deploy.bicep",
		);
	});

	it("should write a new version to a bicep file", async () => {
		const { config, create, logger, relativeTo } = await setupTest("files arm-bicep");
		const fileManager = new ARMBicep(config, logger);

		create.file(
			`metadata contentVersion = '1.2.3'
var contentVersion string = '1.2.3'

  	// This is a comment that should not be changed
`,
			"deploy.bicep",
		);

		fileManager.write(
			{
				name: "deploy.bicep",
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
		const { config, create, logger, relativeTo } = await setupTest("files arm-bicep");
		const fileManager = new ARMBicep(config, logger);

		create.file(
			`metadata contentVersion     ='1.2.3'
var contentVersion string=         "1.2.3"`,
			"deploy.bicep",
		);

		const file = fileManager.read("deploy.bicep");
		expect(file?.version).toBe("1.2.3");

		fileManager.write(
			{
				name: "deploy.bicep",
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
		expect(logger.warn).not.toHaveBeenCalled();
	});

	it("should handle missing type in var declaration", async () => {
		const { config, create, logger, relativeTo } = await setupTest("files arm-bicep");
		const fileManager = new ARMBicep(config, logger);

		create.file(
			`metadata contentVersion = '1.2.3'
var contentVersion = '1.2.3'`,
			"deploy.bicep",
		);

		const file = fileManager.read("deploy.bicep");
		expect(file?.version).toBe("1.2.3");

		fileManager.write(
			{
				name: "deploy.bicep",
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
		const { config, logger } = await setupTest("files arm-bicep");
		const fileManager = new ARMBicep(config, logger);

		// Supported
		expect(fileManager.isSupportedFile("deploy.bicep")).toBe(true);
		expect(fileManager.isSupportedFile("module.bicep")).toBe(true);

		// Not supported
		expect(fileManager.isSupportedFile("deploy.json")).toBe(false);
		expect(fileManager.isSupportedFile("bicep")).toBe(false);
		expect(fileManager.isSupportedFile("deploy.bicep.json")).toBe(false);
	});
});
