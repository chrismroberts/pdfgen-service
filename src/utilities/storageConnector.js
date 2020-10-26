const azure = require('azure-storage')

class StorageConnector {
    constructor() {
        if (process.env.AZURE_STORAGE_CONNECTION) {
            console.log('Azure Storage connection string found, azure-storage output type is available')
            this.blobService = azure.createBlobService(process.env.AZURE_STORAGE_CONNECTION)
        }
        else {
            console.warn('WARNING: Azure Storage connection string not provided, azure-storage output type will not be available')
        }
    }

    createContainerIfNotExists(container) {
        return new Promise((resolve, reject) => {
          this.blobService.createContainerIfNotExists(container, (error, result, resp) => {
                if (error) {
                    reject(error)
                } else {
                    resolve(result)
                }
            })
        })
    }

    uploadBlobFromStream(container, blobPath, stream, streamLength) {
        return new Promise((resolve, reject) => {
            this.blobService.createBlockBlobFromStream(container, blobPath, stream, streamLength, (error, result, resp) => {
                if (error || !resp.isSuccessful) {
                    reject(error)
                } else {
                    resolve(result)
                }
            })
        })
    }

    getBlobSASToken(container, filename, expiryMinutes) {
        let startDate = new Date()
        let expiryDate = new Date(startDate)
        expiryDate.setMinutes(startDate.getMinutes() + expiryMinutes)
        startDate.setMinutes(startDate.getMinutes() - 60)
    
        let sasPolicy = {
          AccessPolicy: {
              Permissions: 'r',
              Start: startDate,
              Expiry: expiryDate
          }
        }
    
        let sas = this.blobService.generateSharedAccessSignature(container, filename, sasPolicy)
        return this.blobService.getUrl(container, filename, sas)
    }
}

module.exports = new StorageConnector()