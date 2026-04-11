import { setupTest } from "../../../tests/setup-tests";
import { MissingPropertyException } from "../file-manager";
import { YAMLPackage } from "../yaml-package";

describe("files yaml-package", () => {
	it("should read a flutter pubspec.yaml file", async () => {
		const { create, relativeTo } = await setupTest("files yaml-package");
		const fileManager = new YAMLPackage();

		create.file(
			`name: wordionary
description: "A new Flutter project."
publish_to: 'none'
version: 1.2.3+55 # Comment about the version number
environment:
  sdk: ^3.5.4

`,
			"pubspec.yaml",
		);

		const file = await fileManager.read(relativeTo("pubspec.yaml"));
		expect(file?.version).toBe("1.2.3");
		expect(file?.builderNumber).toBe("55");
	});

	it("should read a regular yaml file", async () => {
		const { create, relativeTo } = await setupTest("files yaml-package");
		const fileManager = new YAMLPackage();

		create.file(
			`name: My Project
version: 1.2.3 # Comment about the version number
`,
			"my-project.yaml",
		);

		const file = await fileManager.read(relativeTo("my-project.yaml"));
		expect(file?.version).toBe("1.2.3");
		expect(file?.builderNumber).toBeUndefined();
	});

	it("should throw an error if unable to read version", async () => {
		const { create, relativeTo } = await setupTest("files yaml-package");
		const fileManager = new YAMLPackage();

		create.file(
			`name: wordionary
description: "A new Flutter project."
publish_to: 'none'
environment:
  sdk: ^3.5.4
`,
			"pubspec.yaml",
		);

		await expect(async () => await fileManager.read(relativeTo("pubspec.yaml"))).rejects.toThrow(
			MissingPropertyException,
		);
	});

	it("should write a flutter pubspec.yaml file", async () => {
		const { create, relativeTo } = await setupTest("files yaml-package");
		const fileManager = new YAMLPackage();

		create.file(
			`name: wordionary
description: "A new Flutter project."
publish_to: 'none'
version: 1.2.3+55 # Comment about the version number
environment:
  sdk: ^3.5.4
`,
			"pubspec.yaml",
		);

		await fileManager.write(
			{
				path: relativeTo("pubspec.yaml"),
				version: "1.2.3",
				builderNumber: 55,
			},
			"2.4.6",
		);

		const file = await fileManager.read(relativeTo("pubspec.yaml"));
		expect(file?.version).toBe("2.4.6");
		expect(file?.builderNumber).toBe("55");
	});

	it("should write a regular yaml file", async () => {
		const { create, relativeTo } = await setupTest("files yaml-package");
		const fileManager = new YAMLPackage();

		create.file(
			`name: My Project
version: 1.2.3 # Comment about the version number
`,
			"my-project.yaml",
		);

		await fileManager.write(
			{
				path: relativeTo("my-project.yaml"),
				version: "1.2.3",
				builderNumber: undefined,
			},
			"2.4.6",
		);

		const file = await fileManager.read(relativeTo("my-project.yaml"));
		expect(file?.version).toBe("2.4.6");
		expect(file?.builderNumber).toBeUndefined();
	});

	it("should match known yaml files", async () => {
		const fileManager = new YAMLPackage();

		// Supported
		expect(fileManager.isSupportedFile("pubspec.yaml")).toBe(true);
		expect(fileManager.isSupportedFile("pubspec.yml")).toBe(true);
		expect(fileManager.isSupportedFile("my-project.yaml")).toBe(true);
		expect(fileManager.isSupportedFile("my-project.yml")).toBe(true);

		// Not supported
		expect(fileManager.isSupportedFile("my-project.toml")).toBe(false);
		expect(fileManager.isSupportedFile("my-project")).toBe(false);
	});
});
