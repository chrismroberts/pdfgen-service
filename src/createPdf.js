const stream = require('stream')
const pdf = require('html-pdf')
const pdfUtils = require('./pdfUtilities')
const ValidationSchema = require('validate')

module.exports = async (request, response) => {
    let body = request.body
    body.output = body.output || 'response'
    
    let schema = new ValidationSchema({
        html:       { 
            type: String, 
            required: true, 
            message: `html is required and must be a Base64 encoded string`
        },
        output:   {
            type: String, 
            required: true,
            enum: [ 'response', 'azure-storage' ]
        },
        options:     {
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

    let stream = await pdfUtils.convertHtmlToPdfAsStream(inputHtml, convertOpts)
    stream.on('end', () => { response.end() })
    stream.pipe(response)
}

