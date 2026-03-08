import { readFileSync } from "node:fs";

import { setupTest } from "../../../tests/setup-tests";
import { MSBuildProject } from "../ms-build-project";

describe("files ms-build-project", () => {
	it("should read version from csproj file", async () => {
		const { create, logger, relativeTo } = await setupTest("files ms-build-project");
		const fileManager = new MSBuildProject(logger);

		create.file(
			`<Project Sdk="Microsoft.NET.Sdk">
	<PropertyGroup>
		<Version>1.2.3</Version>
	</PropertyGroup>
</Project>
`,
			"API.csproj",
		);

		const file = fileManager.read(relativeTo("API.csproj"));
		expect(file?.version).toBe("1.2.3");
	});

	it("should log a message if unable to read version", async () => {
		const { create, logger, relativeTo } = await setupTest("files ms-build-project");
		const fileManager = new MSBuildProject(logger);

		create.file(
			`<Project Sdk="Microsoft.NET.Sdk">
	<PropertyGroup>
		<Version></Version>
	</PropertyGroup>
</Project>
`,
			"API.csproj",
		);

		const file = fileManager.read(relativeTo("API.csproj"));
		expect(file).toBeUndefined();
		expect(logger.warn).toBeCalledWith(
			"[File Manager] Unable to determine ms-build version: API.csproj",
		);
	});

	it("should write a csproj file", async () => {
		const { create, logger, relativeTo } = await setupTest("files ms-build-project");
		const fileManager = new MSBuildProject(logger);

		create.file(
			`<Project Sdk="Microsoft.NET.Sdk">
	<PropertyGroup>
		<Version>1.2.3</Version>
	</PropertyGroup>
</Project>
`,
			"API.csproj",
		);

		fileManager.write(
			{
				name: "API.csproj",
				path: relativeTo("API.csproj"),
				version: "1.2.3",
			},
			"4.5.6",
		);

		const file = fileManager.read(relativeTo("API.csproj"));
		expect(file?.version).toBe("4.5.6");
	});

	it("should keep the same property ordering", async () => {
		const { create, logger, relativeTo } = await setupTest("files ms-build-project");
		const fileManager = new MSBuildProject(logger);

		create.file(
			`<Project Sdk="Microsoft.NET.Sdk">

	<PropertyGroup>
		<OutputType>Library</OutputType>
		<TargetFramework>net7.0-windows</TargetFramework>
		<Version>1.2.3</Version>
		<ImplicitUsings>enable</ImplicitUsings>
		<Nullable>enable</Nullable>
	</PropertyGroup>

	<ItemGroup>
		<PackageReference Include="Microsoft.Data.Sqlite" Version="7.0.5" />
		<PackageReference Include="Microsoft.EntityFrameworkCore.Sqlite" Version="7.0.5" />
		<PackageReference Include="Microsoft.EntityFrameworkCore.Tools" Version="7.0.5">
			<IncludeAssets>runtime; build; native; contentfiles; analyzers; buildtransitive</IncludeAssets>
		</PackageReference>
		<PackageReference Include="Newtonsoft.Json" Version="13.0.3" />
	</ItemGroup>

</Project>
`,
			"API.csproj",
		);

		fileManager.write(
			{
				name: "API.csproj",
				path: relativeTo("API.csproj"),
				version: "1.2.3",
			},
			"4.5.6",
		);

		const updatedFileContent = readFileSync(relativeTo("API.csproj"), "utf8");

		expect(updatedFileContent).toBe(
			`<Project Sdk="Microsoft.NET.Sdk">

	<PropertyGroup>
		<OutputType>Library</OutputType>
		<TargetFramework>net7.0-windows</TargetFramework>
		<Version>4.5.6</Version>
		<ImplicitUsings>enable</ImplicitUsings>
		<Nullable>enable</Nullable>
	</PropertyGroup>

	<ItemGroup>
		<PackageReference Include="Microsoft.Data.Sqlite" Version="7.0.5" />
		<PackageReference Include="Microsoft.EntityFrameworkCore.Sqlite" Version="7.0.5" />
		<PackageReference Include="Microsoft.EntityFrameworkCore.Tools" Version="7.0.5">
			<IncludeAssets>runtime; build; native; contentfiles; analyzers; buildtransitive</IncludeAssets>
		</PackageReference>
		<PackageReference Include="Newtonsoft.Json" Version="13.0.3" />
	</ItemGroup>

</Project>
`,
		);
	});

	it("should match known ms-build project file extensions", async () => {
		const { logger } = await setupTest("files ms-build-project");
		const fileManager = new MSBuildProject(logger);

		// Supported
		expect(fileManager.isSupportedFile("API.csproj")).toBe(true);
		expect(fileManager.isSupportedFile("API.dbproj")).toBe(true);
		expect(fileManager.isSupportedFile("API.esproj")).toBe(true);
		expect(fileManager.isSupportedFile("API.fsproj")).toBe(true);
		expect(fileManager.isSupportedFile("API.props")).toBe(true);
		expect(fileManager.isSupportedFile("API.vbproj")).toBe(true);
		expect(fileManager.isSupportedFile("API.vcxproj")).toBe(true);

		// Not supported
		expect(fileManager.isSupportedFile("API.txt")).toBe(false);
		expect(fileManager.isSupportedFile("API.json")).toBe(false);
	});
});
