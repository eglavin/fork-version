import { readFileSync } from "node:fs";

import { setupTest } from "../../../tests/setup-tests";
import { MissingPropertyException } from "../../services/file-manager";
import { MalformedMarkupException } from "../../utils/xml-document";
import { MSBuildProject } from "../ms-build-project";

describe("files ms-build-project", () => {
	it("should read version from csproj file", async () => {
		const { create, relativeTo } = await setupTest("files ms-build-project");
		const fileManager = new MSBuildProject();

		create.file(
			`<Project Sdk="Microsoft.NET.Sdk">
	<PropertyGroup>
		<Version>1.2.3</Version>
	</PropertyGroup>
</Project>
`,
			"API.csproj",
		);

		const file = await fileManager.read(relativeTo("API.csproj"));
		expect(file?.version).toBe("1.2.3");
	});

	it("should throw an error if unable to read version", async () => {
		const { create, relativeTo } = await setupTest("files ms-build-project");
		const fileManager = new MSBuildProject();

		create.file(
			`<Project Sdk="Microsoft.NET.Sdk">
	<PropertyGroup>
		<Version></Version>
	</PropertyGroup>
</Project>
`,
			"API.csproj",
		);

		await expect(async () => await fileManager.read(relativeTo("API.csproj"))).rejects.toThrow(
			MissingPropertyException,
		);
	});

	it("should write a csproj file", async () => {
		const { create, relativeTo } = await setupTest("files ms-build-project");
		const fileManager = new MSBuildProject();

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

	it("should keep the same property ordering", async () => {
		const { create, relativeTo } = await setupTest("files ms-build-project");
		const fileManager = new MSBuildProject();

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

		await fileManager.write(
			{
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
		const fileManager = new MSBuildProject();

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

	it("should read version prefix from csproj file", async () => {
		const { create, relativeTo } = await setupTest("files ms-build-project");
		const fileManager = new MSBuildProject();

		create.file(
			`<Project Sdk="Microsoft.NET.Sdk">
	<PropertyGroup>
		<VersionPrefix>1.2.3</VersionPrefix>
	</PropertyGroup>
</Project>
`,
			"API.csproj",
		);

		const file = await fileManager.read(relativeTo("API.csproj"));
		expect(file?.version).toBe("1.2.3");
	});

	it("should read version prefix and suffix from csproj file", async () => {
		const { create, relativeTo } = await setupTest("files ms-build-project");
		const fileManager = new MSBuildProject();

		create.file(
			`<Project Sdk="Microsoft.NET.Sdk">
	<PropertyGroup>
		<VersionPrefix>1.2.3</VersionPrefix>
		<VersionSuffix>beta.1</VersionSuffix>
	</PropertyGroup>
</Project>
`,
			"API.csproj",
		);

		const file = await fileManager.read(relativeTo("API.csproj"));
		expect(file?.version).toBe("1.2.3-beta.1");
	});

	it("should write version prefix to csproj file", async () => {
		const { create, relativeTo } = await setupTest("files ms-build-project");
		const fileManager = new MSBuildProject();

		create.file(
			`<Project Sdk="Microsoft.NET.Sdk">
	<PropertyGroup>
		<VersionPrefix>1.2.3</VersionPrefix>
		<VersionSuffix>beta.1</VersionSuffix>
	</PropertyGroup>
</Project>
`,
			"API.csproj",
		);

		await fileManager.write(
			{
				path: relativeTo("API.csproj"),
				version: "1.2.3-beta.1",
			},
			"1.2.3",
		);

		const file = await fileManager.read(relativeTo("API.csproj"));
		expect(file?.version).toBe("1.2.3");
	});

	it("should write prerelease version prefix and suffix", async () => {
		const { create, relativeTo } = await setupTest("files ms-build-project");
		const fileManager = new MSBuildProject();

		create.file(
			`<Project Sdk="Microsoft.NET.Sdk">
	<PropertyGroup>
		<VersionPrefix>1.2.3</VersionPrefix>
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
			"4.5.6-beta-1",
		);

		const file = await fileManager.read(relativeTo("API.csproj"));
		expect(file?.version).toBe("4.5.6-beta-1");
	});

	it("should read a version from a later PropertyGroup", async () => {
		const { create, relativeTo } = await setupTest("files ms-build-project");
		const fileManager = new MSBuildProject();

		const original = `<Project Sdk="Microsoft.NET.Sdk">
	<PropertyGroup>
		<TargetFramework>net8.0</TargetFramework>
	</PropertyGroup>
	<PropertyGroup Condition="'$(Configuration)'=='Release'">
		<Version>1.2.3</Version>
	</PropertyGroup>
</Project>
`;
		create.file(original, "API.csproj");

		const file = await fileManager.read(relativeTo("API.csproj"));
		expect(file?.version).toBe("1.2.3");

		await fileManager.write({ path: relativeTo("API.csproj"), version: "1.2.3" }, "4.5.6");

		expect(readFileSync(relativeTo("API.csproj"), "utf8")).toBe(
			original.replace("<Version>1.2.3<", "<Version>4.5.6<"),
		);
	});

	it("should read the first version but write every duplicate", async () => {
		const { create, relativeTo } = await setupTest("files ms-build-project");
		const fileManager = new MSBuildProject();

		const original = `<Project Sdk="Microsoft.NET.Sdk">
	<PropertyGroup>
		<Version>1.2.3</Version>
	</PropertyGroup>
	<PropertyGroup Condition="'$(Configuration)'=='Release'">
		<Version>1.2.3</Version>
	</PropertyGroup>
</Project>
`;
		create.file(original, "API.csproj");

		const file = await fileManager.read(relativeTo("API.csproj"));
		expect(file?.version).toBe("1.2.3");

		await fileManager.write({ path: relativeTo("API.csproj"), version: "1.2.3" }, "4.5.6");

		expect(readFileSync(relativeTo("API.csproj"), "utf8")).toBe(
			original.replaceAll("<Version>1.2.3<", "<Version>4.5.6<"),
		);
	});

	it("should ignore a version outside of a PropertyGroup", async () => {
		const { create, relativeTo } = await setupTest("files ms-build-project");
		const fileManager = new MSBuildProject();

		create.file(
			`<Project Sdk="Microsoft.NET.Sdk">
	<Target Name="Stamp">
		<Version>1.2.3</Version>
	</Target>
</Project>
`,
			"API.csproj",
		);

		await expect(async () => await fileManager.read(relativeTo("API.csproj"))).rejects.toThrow(
			MissingPropertyException,
		);
	});

	it("should keep crlf line endings when updating a version", async () => {
		const { create, relativeTo } = await setupTest("files ms-build-project");
		const fileManager = new MSBuildProject();

		const original = [
			`<Project Sdk="Microsoft.NET.Sdk">`,
			"\t<PropertyGroup>",
			"\t\t<Version>1.2.3</Version>",
			"\t</PropertyGroup>",
			"</Project>",
			"",
		].join("\r\n");
		create.file(original, "API.csproj");

		await fileManager.write({ path: relativeTo("API.csproj"), version: "1.2.3" }, "4.5.6");

		expect(readFileSync(relativeTo("API.csproj"), "utf8")).toBe(
			original.replace("<Version>1.2.3<", "<Version>4.5.6<"),
		);
	});

	it("should keep crlf line endings when adding a version suffix", async () => {
		const { create, relativeTo } = await setupTest("files ms-build-project");
		const fileManager = new MSBuildProject();

		create.file(
			[
				`<Project Sdk="Microsoft.NET.Sdk">`,
				"\t<PropertyGroup>",
				"\t\t<VersionPrefix>1.2.3</VersionPrefix>",
				"\t</PropertyGroup>",
				"</Project>",
				"",
			].join("\r\n"),
			"API.csproj",
		);

		await fileManager.write({ path: relativeTo("API.csproj"), version: "1.2.3" }, "4.5.6-beta.1");

		expect(readFileSync(relativeTo("API.csproj"), "utf8")).toBe(
			[
				`<Project Sdk="Microsoft.NET.Sdk">`,
				"\t<PropertyGroup>",
				"\t\t<VersionPrefix>4.5.6</VersionPrefix>",
				"\t\t<VersionSuffix>beta.1</VersionSuffix>",
				"\t</PropertyGroup>",
				"</Project>",
				"",
			].join("\r\n"),
		);
	});

	it("should keep crlf line endings when removing a version suffix", async () => {
		const { create, relativeTo } = await setupTest("files ms-build-project");
		const fileManager = new MSBuildProject();

		create.file(
			[
				`<Project Sdk="Microsoft.NET.Sdk">`,
				"\t<PropertyGroup>",
				"\t\t<VersionPrefix>1.2.3</VersionPrefix>",
				"\t\t<VersionSuffix>beta.1</VersionSuffix>",
				"\t</PropertyGroup>",
				"</Project>",
				"",
			].join("\r\n"),
			"API.csproj",
		);

		await fileManager.write({ path: relativeTo("API.csproj"), version: "1.2.3-beta.1" }, "4.5.6");

		expect(readFileSync(relativeTo("API.csproj"), "utf8")).toBe(
			[
				`<Project Sdk="Microsoft.NET.Sdk">`,
				"\t<PropertyGroup>",
				"\t\t<VersionPrefix>4.5.6</VersionPrefix>",
				"\t</PropertyGroup>",
				"</Project>",
				"",
			].join("\r\n"),
		);
	});

	it("should keep the byte order mark of a visual studio project file", async () => {
		const { create, relativeTo } = await setupTest("files ms-build-project");
		const fileManager = new MSBuildProject();

		const original =
			"﻿" +
			[
				`<?xml version="1.0" encoding="utf-8"?>`,
				`<Project DefaultTargets="Build" xmlns="http://schemas.microsoft.com/developer/msbuild/2003">`,
				`\t<ItemGroup Label="ProjectConfigurations">`,
				`\t\t<ProjectConfiguration Include="Debug|Win32" />`,
				"\t</ItemGroup>",
				"\t<PropertyGroup>",
				"\t\t<Version>1.2.3</Version>",
				"\t</PropertyGroup>",
				"</Project>",
				"",
			].join("\r\n");
		create.file(original, "API.vcxproj");

		const file = await fileManager.read(relativeTo("API.vcxproj"));
		expect(file?.version).toBe("1.2.3");

		await fileManager.write({ path: relativeTo("API.vcxproj"), version: "1.2.3" }, "4.5.6");

		expect(readFileSync(relativeTo("API.vcxproj"), "utf8")).toBe(
			original.replace("<Version>1.2.3<", "<Version>4.5.6<"),
		);
	});

	it("should not reformat unrelated markup", async () => {
		const { create, relativeTo } = await setupTest("files ms-build-project");
		const fileManager = new MSBuildProject();

		const original = `<Project Sdk="Microsoft.NET.Sdk">
	<PropertyGroup>
		<Version>1.2.3</Version>
		<Description>Handles a "/> sequence</Description>
	</PropertyGroup>
	<ItemGroup>
		<None Include="a.txt"/>
	</ItemGroup>
</Project>
`;
		create.file(original, "API.csproj");

		await fileManager.write({ path: relativeTo("API.csproj"), version: "1.2.3" }, "4.5.6");

		expect(readFileSync(relativeTo("API.csproj"), "utf8")).toBe(
			original.replace("<Version>1.2.3<", "<Version>4.5.6<"),
		);
	});

	it("should update a version prefix and suffix in any order", async () => {
		const { create, relativeTo } = await setupTest("files ms-build-project");
		const fileManager = new MSBuildProject();

		const original = `<Project Sdk="Microsoft.NET.Sdk">
	<PropertyGroup>
		<VersionSuffix>beta.1</VersionSuffix>
	</PropertyGroup>
	<PropertyGroup>
		<VersionPrefix>1.2.3</VersionPrefix>
	</PropertyGroup>
</Project>
`;
		create.file(original, "API.csproj");

		const file = await fileManager.read(relativeTo("API.csproj"));
		expect(file?.version).toBe("1.2.3-beta.1");

		await fileManager.write(
			{ path: relativeTo("API.csproj"), version: "1.2.3-beta.1" },
			"9.9.9-rc.2",
		);

		expect(readFileSync(relativeTo("API.csproj"), "utf8")).toBe(
			original
				.replace("<VersionSuffix>beta.1<", "<VersionSuffix>rc.2<")
				.replace("<VersionPrefix>1.2.3<", "<VersionPrefix>9.9.9<"),
		);
	});

	it("should write to an empty or self closing version element", async () => {
		const { create, relativeTo } = await setupTest("files ms-build-project");
		const fileManager = new MSBuildProject();

		create.file(
			`<Project Sdk="Microsoft.NET.Sdk">
	<PropertyGroup>
		<Version></Version>
	</PropertyGroup>
</Project>
`,
			"Empty.csproj",
		);
		create.file(
			`<Project Sdk="Microsoft.NET.Sdk">
	<PropertyGroup>
		<Version />
	</PropertyGroup>
</Project>
`,
			"SelfClosing.csproj",
		);

		await fileManager.write({ path: relativeTo("Empty.csproj"), version: "" }, "4.5.6");
		await fileManager.write({ path: relativeTo("SelfClosing.csproj"), version: "" }, "4.5.6");

		expect(readFileSync(relativeTo("Empty.csproj"), "utf8")).toContain("<Version>4.5.6</Version>");
		expect(readFileSync(relativeTo("SelfClosing.csproj"), "utf8")).toContain(
			"<Version>4.5.6</Version>",
		);
	});

	it("should handle a close tag with trailing whitespace", async () => {
		const { create, relativeTo } = await setupTest("files ms-build-project");
		const fileManager = new MSBuildProject();

		const original = `<Project Sdk="Microsoft.NET.Sdk">
	<PropertyGroup>
		<VersionPrefix>1.2.3</VersionPrefix >
	</PropertyGroup>
</Project>
`;
		create.file(original, "API.csproj");

		await fileManager.write({ path: relativeTo("API.csproj"), version: "1.2.3" }, "4.5.6-beta.1");

		expect(readFileSync(relativeTo("API.csproj"), "utf8")).toBe(
			original.replace(
				"<VersionPrefix>1.2.3</VersionPrefix >",
				"<VersionPrefix>4.5.6</VersionPrefix >\n\t\t<VersionSuffix>beta.1</VersionSuffix>",
			),
		);
	});

	it("should not write a file it cannot parse safely", async () => {
		const { create, relativeTo } = await setupTest("files ms-build-project");
		const fileManager = new MSBuildProject();

		const original = `<Project Sdk="Microsoft.NET.Sdk">
	<PropertyGroup>
		<Version></Version`;
		create.file(original, "API.csproj");

		await expect(
			async () =>
				await fileManager.write({ path: relativeTo("API.csproj"), version: "1.2.3" }, "4.5.6"),
		).rejects.toThrow(MalformedMarkupException);

		expect(readFileSync(relativeTo("API.csproj"), "utf8")).toBe(original);
	});
});
