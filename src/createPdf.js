const stream = require('stream')
const pdfUtils = require('./utilities/pdfUtilities')

const ValidationSchema = require('validate')
const StorageConnector = require('./utilities/storageConnector')

module.exports = async (request, response) => {
    let body = request.body
    body.output = body.output || 'response'

    let schema = new ValidationSchema({
        html: { 
            type: String, 
            required: true, 
            message: `html is required and must be a Base64 encoded string`
        },
        output: {
            type: String, 
            required: true,
            enum: [ 'response', 'azure-storage' ]
        },
        options: {
            type: Object,
            message: `options should be an object. For documentation, see https://github.com/marcbachmann/node-html-pdf#options`
        }
    }, { strip: false })    

    let validationErrors = schema.validate(body)
    if (validationErrors.length > 0) {        
        return response.status(400).send(validationErrors.map(err => err.message))
    }

    let inputHtml = Buffer.from(body.html, 'base64').toString()
    let convertOpts = body.options || { }

    if (body.output == 'response') {
        try {            
            let stream = await pdfUtils.convertHtmlToPdfAsStream(inputHtml, convertOpts)
            let filename = body.filename || 'output.pdf'
            response.setHeader('Content-Disposition', `attachment: filename=${filename}`)

            stream.on('end', () => { response.end() })
            stream.pipe(response)

        } catch (error) {
            console.error(error)
            return response.status(500).send('Error while converting HTML to PDF stream')
        }
    }
    else if (body.output == 'azure-storage') {
        // Ensure we have storage connection details for Blob storage
        if (!process.env.AZURE_STORAGE_CONNECTION) {
            return response.status(500).send([
                'Cannot output to Azure Storage: Connection to storage not available'
            ])
        }

        // Check presence of container and filename on request if output is azure-storage
        let { container, filename } = body

        if (!container || !filename) {
            return response.status(400).send([
                `container and filename must be specified when output is 'azure-storage'`
            ])
        }

        // All present and correct, convert to PDF and upload
        try {
            let blobStream = await pdfUtils.convertHtmlToPdfAsStream(inputHtml, convertOpts)            
            await StorageConnector.createContainerIfNotExists(container)
            await StorageConnector.uploadBlobFromStream(container, filename, blobStream, blobStream.readableLength)

            return response.status(201).send({
                access_url: StorageConnector.getBlobSASToken(container, filename, 24*60),
                filename: filename,
            }).end()

        } catch (error) {
            console.error(error)
            return response.status(500).send('Error while converting HTML to PDF and uploading to Azure Storage')
        }
    }
    else {
        return response.status(400).send([
            `${body.output} is not a supported output type`
        ])
    }
}