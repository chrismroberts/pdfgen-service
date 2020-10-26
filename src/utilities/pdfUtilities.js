const stream = require('stream')
const pdf = require('html-pdf')

module.exports = {
    convertHtmlToPdfAsStream(html, options) {
        return new Promise((resolve, reject) => {
            pdf.create(html, options).toStream((error, stream) => {
                if (error) {
                    console.error('Error while creating PDF stream', error)
                    reject(error)
                }
                else {
                    resolve(stream)
                }
            })
        })
    },
    convertHTMLToPDFAsBuffer(html, options) {
        return new Promise((resolve, reject) => {
            pdf.create(html, options).toBuffer((error, buffer) => {
                if (error) {
                    console.error('Error while creating PDF buffer', error)
                    reject(error)
                }
                else {
                    resolve(buffer)                
                }
            })
        })
    }
}