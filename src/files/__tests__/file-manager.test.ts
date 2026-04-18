/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { readFile, writeFile } from "node:fs/promises";
import { readFileSync } from "node:fs";

import { setupTest } from "../../../tests/setup-tests";
import {
	defineFileManager,
	FileManager,
	MissingPropertyException,
	type FileState,
	type IFileManager,
} from "../file-manager";

describe("files file-manager", () => {
	describe("json file", () => {
		it("should read .json", async () => {
			const { config, create, logger } = await setupTest("files file-manager");
			const fileManager = new FileManager(config, logger);

			create.json({ version: "1.2.3" }, "package.json");

			const file = await fileManager.read("package.json");
			expect(file).toBeDefined();
			expect(file?.version).toBe("1.2.3");
			expect(file?.buildMetadata).toBeUndefined();
		});

		it("should write .json", async () => {
			const { config, create, logger, relativeTo } = await setupTest("files file-manager");
			const fileManager = new FileManager(config, logger);

			create.json({ version: "1.0.0" }, "package.json");

			await fileManager.write(
				{
					path: relativeTo("package.json"),
					version: "1.2.2",
				},
				"1.2.3",
			);

			const packageJSON = JSON.parse(readFileSync(relativeTo("package.json"), "utf8"));
			expect(packageJSON.version).toBe("1.2.3");
		});

		it("should retain build metadata when writing new version", async () => {
			const { config, create, logger, relativeTo } = await setupTest("files file-manager");
			const fileManager = new FileManager(config, logger);

			create.json({ version: "1.2.3+55" }, "package.json");

			const file = await fileManager.read("package.json");
			expect(file).toBeDefined();
			expect(file?.version).toBe("1.2.3");
			expect(file?.buildMetadata).toBe("55");

			await fileManager.write(file!, "1.2.4");

			const packageJSON = JSON.parse(readFileSync(relativeTo("package.json"), "utf8"));
			expect(packageJSON.version).toBe("1.2.4+55");
		});
	});

	describe("yaml file", () => {
		it("should read .yaml", async () => {
			const { config, create, logger } = await setupTest("files file-manager");
			const fileManager = new FileManager(config, logger);

			create.file(
				`name: wordionary
description: "A new Flutter project."
publish_to: 'none'
version: 1.2.3 # Comment about the version number
environment:
  sdk: ^3.5.4

`,
				"pubspec.yaml",
			);

			const file = await fileManager.read("pubspec.yaml");
			expect(file).toBeDefined();
			expect(file?.version).toBe("1.2.3");
			expect(file?.buildMetadata).toBeUndefined();
		});

		it("should write .yaml", async () => {
			const { config, create, logger, relativeTo } = await setupTest("files file-manager");
			const fileManager = new FileManager(config, logger);

			create.file(
				`name: wordionary
description: "A new Flutter project."
publish_to: 'none'
version: 1.2.3 # Comment about the version number
environment:
  sdk: ^3.5.4
`,
				"pubspec.yaml",
			);

			await fileManager.write(
				{
					path: relativeTo("pubspec.yaml"),
					version: "1.2.3",
				},
				"2.4.6",
			);

			const file = await fileManager.read(relativeTo("pubspec.yaml"));
			expect(file).toBeDefined();
			expect(file?.version).toBe("2.4.6");
			expect(file?.buildMetadata).toBeUndefined();
		});

		it("should retain build metadata when writing new version to .yaml", async () => {
			const { config, create, logger, relativeTo } = await setupTest("files file-manager");
			const fileManager = new FileManager(config, logger);

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

			const file = await fileManager.read("pubspec.yaml");
			expect(file).toBeDefined();
			expect(file?.version).toBe("1.2.3");
			expect(file?.buildMetadata).toBe("55");

			await fileManager.write(file!, "2.4.6");

			const updatedFile = await fileManager.read(relativeTo("pubspec.yaml"));
			expect(updatedFile).toBeDefined();
			expect(updatedFile?.version).toBe("2.4.6");
			expect(updatedFile?.buildMetadata).toBe("55");
		});
	});

	describe("plain text file", () => {
		it("should read version.txt", async () => {
			const { config, create, logger } = await setupTest("files file-manager");
			const fileManager = new FileManager(config, logger);

			create.file("1.2.3", "version.txt");

			const file = await fileManager.read("version.txt");
			expect(file).toBeDefined();
			expect(file?.version).toBe("1.2.3");
			expect(file?.buildMetadata).toBeUndefined();
		});

		it("should write version.txt", async () => {
			const { config, create, logger, relativeTo } = await setupTest("files file-manager");
			const fileManager = new FileManager(config, logger);

			create.file("1.0.0", "version.txt");

			await fileManager.write(
				{
					path: relativeTo("version.txt"),
					version: "1.2.2",
				},
				"1.2.3",
			);

			const version = readFileSync(relativeTo("version.txt"), "utf8");
			expect(version).toBe("1.2.3");
		});

		it("should retain build metadata when writing new version to version.txt", async () => {
			const { config, create, logger, relativeTo } = await setupTest("files file-manager");
			const fileManager = new FileManager(config, logger);

			create.file("1.2.3+55", "version.txt");

			await fileManager.write(
				{
					path: relativeTo("version.txt"),
					version: "1.2.3",
					buildMetadata: "55",
				},
				"1.2.4",
			);

			const version = readFileSync(relativeTo("version.txt"), "utf8");
			expect(version).toBe("1.2.4+55");
		});
	});

	describe("csproj file", () => {
		it("should read .csproj", async () => {
			const { config, create, logger } = await setupTest("files file-manager");
			const fileManager = new FileManager(config, logger);

			create.file(
				`<Project Sdk="Microsoft.NET.Sdk">
			<PropertyGroup>
				<Version>1.2.3</Version>
			</PropertyGroup>
		</Project>
		`,
				"API.csproj",
			);

			const file = await fileManager.read("API.csproj");
			expect(file).toBeDefined();
			expect(file?.version).toBe("1.2.3");
			expect(file?.buildMetadata).toBeUndefined();
		});

		it("should write .csproj", async () => {
			const { config, create, logger, relativeTo } = await setupTest("files file-manager");
			const fileManager = new FileManager(config, logger);

			create.file(
				`<Project Sdk="Microsoft.NET.Sdk">
	<PropertyGroup>
		<Version>1.2.3</Version>
	</PropertyGroup>
</Project>
`,
				"API.csproj",
			);

			await fileManager.write(
				{
					path: relativeTo("API.csproj"),
					version: "1.2.3",
				},
				"4.5.6",
			);

			const file = await fileManager.read(relativeTo("API.csproj"));
			expect(file?.version).toBe("4.5.6");
		});
	});

	describe("custom file managers", () => {
		class CustomFileManager implements IFileManager {
			async read(filePath: string): Promise<FileState | undefined> {
				const fileContent = await readFile(filePath, "utf-8");
				if (fileContent) {
					const parsedContent = JSON.parse(fileContent);
					if ("package" in parsedContent && "version" in parsedContent.package) {
						return {
							path: filePath,
							version: parsedContent.package.version,
						};
					}
				}
				throw new MissingPropertyException("My Custom File", "package.version");
			}

			async write(fileState: FileState, newVersion: string): Promise<void> {
				const fileContent = await readFile(fileState.path, "utf-8");
				if (fileContent) {
					const parsedContent = JSON.parse(fileContent);
					if ("package" in parsedContent && "version" in parsedContent.package) {
						parsedContent.package.version = newVersion;
						const updatedContent = JSON.stringify(parsedContent, null, 2);
						await writeFile(fileState.path, updatedContent, "utf-8");
					}
				}
			}

			isSupportedFile(fileName: string) {
				return fileName === "test.json";
			}
		}

		const CustomFileManagerObject = defineFileManager({
			read: async (filePath) => {
				const fileContent = await readFile(filePath, "utf-8");
				if (fileContent) {
					const parsedContent = JSON.parse(fileContent);
					if ("package" in parsedContent && "version" in parsedContent.package) {
						return {
							path: filePath,
							version: parsedContent.package.version,
						};
					}
				}
				throw new MissingPropertyException("My Custom File", "package.version");
			},
			write: async (fileState, newVersion) => {
				const fileContent = await readFile(fileState.path, "utf-8");
				if (fileContent) {
					const parsedContent = JSON.parse(fileContent);
					if ("package" in parsedContent && "version" in parsedContent.package) {
						parsedContent.package.version = newVersion;
						const updatedContent = JSON.stringify(parsedContent, null, 2);
						await writeFile(fileState.path, updatedContent, "utf-8");
					}
				}
			},
			isSupportedFile: (fileName) => fileName === "test.json",
		});

		it("should use custom file manager if it supports the file given file", async () => {
			const { config, create, logger } = await setupTest("files file-manager");

			config.customFileManagers = [new CustomFileManager()];

			const fileManager = new FileManager(config, logger);

			create.file(
				`{
	"package": {
		"name": "test-package",
		"version": "1.2.3"
	}
}`,
				"test.json",
			);

			const file = await fileManager.read("test.json");
			expect(file?.version).toBe("1.2.3");

			await fileManager.write(file!, "2.3.4");

			const updatedFile = await fileManager.read("test.json");
			expect(updatedFile?.version).toBe("2.3.4");
		});

		it("should log an error if custom file manager is missing required property", async () => {
			const { config, create, logger } = await setupTest("files file-manager");

			config.customFileManagers = [new CustomFileManager()];

			const fileManager = new FileManager(config, logger);

			create.file(
				`{
	"package": {
		"name": "test-package"
	}
}`,
				"test.json",
			);

			expect(await fileManager.read("test.json")).toBeUndefined();
			expect(logger.warn).toHaveBeenCalledWith(
				"[File Manager] Missing 'package.version' property in My Custom File file: test.json",
			);
		});

		it("should use custom file manager object if it supports the file given file", async () => {
			const { config, create, logger } = await setupTest("files file-manager");

			config.customFileManagers = [CustomFileManagerObject];
			const fileManager = new FileManager(config, logger);

			create.file(
				`{
	"package": {
		"name": "test-package",
		"version": "1.2.3"
	}
}`,
				"test.json",
			);

			const file = await fileManager.read("test.json");
			expect(file?.version).toBe("1.2.3");

			await fileManager.write(file!, "2.3.4");

			const updatedFile = await fileManager.read("test.json");
			expect(updatedFile?.version).toBe("2.3.4");
		});
	});

	describe("unsupported file type", () => {
		it("should log an error when read file type is not supported", async () => {
			const { config, create, logger } = await setupTest("files file-manager");
			const fileManager = new FileManager(config, logger);

			create.file("Version: 1.2.3", "version.unknown");

			await fileManager.read("version.unknown");
			expect(logger.error).toHaveBeenCalledWith("[File Manager] Unsupported file: version.unknown");
		});

		it("should log an error when write file type is not supported", async () => {
			const { config, logger, relativeTo } = await setupTest("files file-manager");
			const fileManager = new FileManager(config, logger);

			await fileManager.write(
				{
					path: relativeTo("version.unknown"),
					version: "1.2.2",
				},
				"1.2.3",
			);
			expect(logger.error).toHaveBeenCalledWith(`[File Manager] Unsupported file: version.unknown`);
		});
	});

	describe("general file manager behavior", () => {
		it("should handle absolute file paths", async () => {
			const { config, create, logger, relativeTo } = await setupTest("files file-manager");
			const fileManager = new FileManager(config, logger);

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
		});

		it("should not write to file if dry run is enabled", async () => {
			const { config, logger, relativeTo } = await setupTest("files file-manager");
			config.dryRun = true;
			const fileManager = new FileManager(config, logger);

			await fileManager.write(
				{
					path: relativeTo("package.json"),
					version: "1.2.2",
				},
				"1.2.3",
			);

			expect(() => readFileSync(relativeTo("package.json"))).toThrow();
		});

		it("should return early if file doesn't exist", async () => {
			const { config, logger } = await setupTest("files file-manager");
			const fileManager = new FileManager(config, logger);

			const file = await fileManager.read("nonexistent.json");
			expect(file).toBeUndefined();
		});

		it("should log a warning if a file is missing a required property", async () => {
			const { config, create, logger } = await setupTest("files file-manager");
			const fileManager = new FileManager(config, logger);

			create.json({ name: "test-package" }, "package.json");

			const file = await fileManager.read("package.json");
			expect(file).toBeUndefined();
			expect(logger.warn).toHaveBeenCalledWith(
				"[File Manager] Missing 'version' property in JSON file: package.json",
			);
		});
	});
});
