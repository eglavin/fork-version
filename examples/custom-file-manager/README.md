# Custom File Manger Example

This example demonstrates how to use fork-version with a custom file manager to modify files that aren't currently supported by fork-version.

Have a look at the [fork-version.ts](./fork.config.ts) config file in this folder, where a custom file manager has been registered to handle updating a custom json file called `my-json-file.json`.

This file has its version property nested under an object called package:

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

> [!NOTE]
> Have a look at the [files folder](https://github.com/eglavin/fork-version/tree/f2818ed220e0bfd0d86de0efdc720c6ad838128c/src/files) within the fork-version source code for example on how to work with different file types.
