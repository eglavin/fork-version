# Custom File Manger Example

This example demonstrates how to use fork-version with a custom file manager to modify files which don't have built in support.

Have a look at the [fork-version.ts](./fork.config.ts) config file in this folder, where a custom file manager has been registered to handle updating a custom json file called `my-json-file.json`.

This file has a version property nested under an object called package:

```json
{
  "package": {
    "version": "1.2.3"
  }
}
```

The following command would update both the existing `package.json` file and the custom `my-json-file.json` files using a glob star to select all json files.

```ps1
npx fork-version -G "*.json"
```

You can define a custom file manager either by implementing the `IFileManager` interface in a class, or by using the optional `defineFileManager` function to create a file manager object. Both approaches are shown in this example:

- [custom-file-manager-class.ts](./custom-file-manager-class.ts) - defines a custom file manager class which implements the `IFileManager` interface.
- [custom-file-manager-function.ts](./custom-file-manager-function.ts) - defines a custom file manager using the `defineFileManager` function.

> [!NOTE]
> Have a look at the [files folder](../../src/files) within the fork-version source code for example on how to work with different file types.
