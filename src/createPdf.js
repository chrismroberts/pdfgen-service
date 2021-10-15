const stream = require('stream')
const axios = require('axios')
const pdfUtils = require('./utilities/pdfUtilities')

const ValidationSchema = require('validate')
const StorageConnector = require('./utilities/storageConnector')

module.exports = async (request, response) => {
    let body = request.body
    body.output = body.output || 'response'

    let schema = new ValidationSchema({
        html: { 
            type: String,       
            message: `'html' must be a Base64 encoded string`
        },
        url: {
            type: String,
            message: `'url' must be a string`
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

    let inputHtml = ''

    if (body.html) {
        inputHtml = Buffer.from(body.html, 'base64').toString()
    }
    else if (body.url) {
        try {
            let urlResponse = await axios.default.get(body.url)
            inputHtml = urlResponse.data
            
        } catch (error) {
            if (error.isAxiosError) {
                let statusCodeInfo = error.response && error.response.status ? ` (Status ${error.response.status})` : ''
                return response.status(400).send([
                    `Error getting HTML from ${body.url}${statusCodeInfo}. Response: ${error.message}`
                ])
            }
            
            return response.status(500).send([`Unknown error while downloading from ${body.url}: ${error.message}`])
        }
    }
    else {
        return response.status(400).send([`Must specify Base64 encoded HTML string as 'html' or URL to HTML document as 'url'`])
    }

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