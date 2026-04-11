metadata contentVersion = '1.2.3'
var contentVersion string = '1.2.3'

@description('The name of the storage account to use for site hosting.')
param storageAccountName string = 'stor${uniqueString(resourceGroup().id)}'

resource storageAccount 'Microsoft.Storage/storageAccounts@2021-06-01' = {
  name: storageAccountName
  location: resourceGroup().location
  kind: 'StorageV2'
  sku: {
    name: 'Standard_LRS'
  }
  tags: {
    currentVersion: contentVersion
  }
}

output staticWebsiteUrl string = storageAccount.properties.primaryEndpoints.web
