# Supported File Managers

This document describes the file managers that are supported by Fork-Version out of the box, as well as how to create custom file managers for unsupported file types.

- [Json Package](#json-package)
- [Yaml Package](#yaml-package)
- [Plain Text](#plain-text)
- [MS Build](#ms-build)
- [ARM Bicep](#arm-bicep)
- [Install Shield ISM](#install-shield-ism)
- [Custom File Updater's](#custom-file-updaters)

> [!Note]
> If your version strings include build metadata, it will be retained as is. Examples of version strings with build metadata include:
>
> - 1.2.3+49a3f2b
> - 1.2.3-0+49a3f2b
> - 1.2.3-alpha.0+49a3f2b

## Json Package

A json package is a json file which contains a version property, such as a npm `package.json` file.

```json
{
  "name": "my-project",
  "version": "1.2.3",
  "private": false,
}
```

## Yaml Package

A yaml package is a yaml file which contains a version property, such as a dart `pubspec.yaml` file.

```yaml
name: wordionary
description: "My project"
publish_to: 'none'
version: 1.2.3
```

## Plain Text

A plain text file is a file which contains just the version as the content. Any files that end with `version.txt` will be treated as a plain text version file.

```text
1.2.3
```

## MS Build

A MS build project is an xml file with a `Version` property under the `Project > PropertyGroup` node group.

```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <Version>1.2.3</Version>
  </PropertyGroup>
</Project>
```

Fork-Version currently supports reading and updating the following file extensions: `.csproj` `.dbproj` `.esproj` `.fsproj` `.props` `.vbproj` `.vcxproj`

## ARM Bicep

An ARM bicep file `*.bicep` is a file with a metadata property called `contentVersion` and an optional variable called `contentVersion`.

```bicep
metadata contentVersion = '1.2.3.4'
var contentVersion string = '1.2.3.4'
```

## Install Shield ISM

An Install Shield `*.ism` file can be either binary or an xml file. Fork-Version only supports the xml version.

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<?xml-stylesheet type="text/xsl" href="is.xsl" ?>
<!DOCTYPE msi [...]>
<msi version="2.0" xmlns:dt="urn:schemas-microsoft-com:datatypes">

  <table name="Property">
    <row><td>ProductVersion</td><td>1.2.3</td><td/></row>
  </table>

</msi>
```

## Custom File Updater's

***Released in version 5.1.0***

If you have a file type that isn't supported by one of the built-in file managers, you can create a custom file manager to read and write the updated version to that file.

To do this you will need to create a class or an object that implements the `IFileManager` interface and add an instance of that class or object to the `customFileManagers` array in your config. If you don't want to create a class, you can use the optional `defineFileManager` function when creating a custom file manager.

The following example show a custom file manager for a json file with the name of `test.json` with the following structure:

```json
// test.json
{
  "package": {
    "version": "1.2.3"
  }
}
```

Example Custom File Manager implementation:

- [Using a class to define a file manager](../examples/custom-file-manager/custom-file-manager-class.ts)
- [Using the defineFileManager function](../examples/custom-file-manager/custom-file-manager-function.ts)

```ts
// fork.config.ts
import { readFile, writeFile } from "node:fs/promises";
import { defineConfig, MissingPropertyException, type FileState, type IFileManager } from "fork-version";

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

export default defineConfig({
  customFileManagers: [new CustomFileManager()],
});
```

> [See `IFileManager` interface to see the required methods and properties for a custom file manager.](../src/files/file-manager.ts)
