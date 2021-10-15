This is an Express wrapper for the html-pdf package that provides a convenient endpoint for uploading HTML and receiving a PDF result.

You can specify an Azure Storage connection string as `process.env.AZURE_STORAGE_CONNECTION` and the service will output the generated PDF to a storage container and blob name of your choice.

To run the Docker container:

```
docker build -t pdf-gen-service .
docker run --rm -it -p 3000:3000 -e AZURE_STORAGE_CONNECTION=<storage connection string> pdf-gen-service
```

Or:

```
docker run --rm -it -p 3000:3000 -e AZURE_STORAGE_CONNECTION=<storage connection string> chrismroberts/pdfgen-service:1.1.0
```

If you don't specify the `AZURE_STORAGE_CONNECTION` the service will start, but the only available output will be as a file download (with `Content-Disposition` header set)

#### Request Format

The service accepts `application/json` formatted POST requests on the root, e.g. `http://localhost:3000`.

```
POST http://localhost:3000/
``` 

#### Converting from a HTML String
HTML you wish to convert to PDF must be Base64 encoded before sending in the request, e.g:

`<h2>Open the pod bay doors, Hal</h2>`

Becomes:

`PGgyPk9wZW4gdGhlIHBvZCBiYXkgZG9vcnMsIEhhbDwvaDI+`

To create and download a PDF, use the following request and format:

Body:
```json
{
    "html": "PGgyPk9wZW4gdGhlIHBvZCBiYXkgZG9vcnMsIEhhbDwvaDI+",    
    "output": "response",
    "options": {
        "orientation": "landscape"
        /* ... */
    }
}
```
#### Converting from a URL
You can also specify a URL to the HTML you'd like to convert. In this case, use the following request:

Body:
```json
{
    "url": "http://url/to/file.html",    
    "output": "response"
}
```

#### Output to Azure Storage Container
To create a PDF and upload straight to an Azure Storage blob:

```json
{
    "html": "PGgyPk9wZW4gdGhlIHBvZCBiYXkgZG9vcnMsIEhhbDwvaDI+",    
    "output": "azure-storage",
    "container": "new-container",
    "filename": "subfolder/dave.pdf",
    "options": {
        "orientation": "landscape"
        /* ... */
    }
}
```

The service will attempt to create the container if it doesn't already exist. You will receive a response with the tokenized access URL to the blob:

```json
{
    "access_url": "https://{account}.blob.core.windows.net/new-container/subfolder/dave.pdf?st={sasToken}",
    "filename": "subfolder/dave.pdf"
}
```

Note: The `options` field is... optional, and is passed directly to the html-pdf package. Full reference can be found at https://github.com/marcbachmann/node-html-pdf#options