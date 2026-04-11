# All Files Example

This example demonstrates fork-version updating all supported file types.

The following command specifically selects each file:

```ps1
npx fork-version `
  --file main.bicep `
  --file pubsec.yaml `
  --file installer.ism `
  --file Fork-Version.Api.csproj `
  --file package.json `
  --file my-version.txt
```
