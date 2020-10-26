console.log('Starting PDF Gen service...')
const express = require('express')
const bodyParser = require('body-parser')

// Patch to handle async errors in Express routes without try/catch
require('express-async-errors')

// Start up Express app with JSON parser middleware
const app = express()
app.use(bodyParser.json({ limit: '5mb' }))

// Create PDF route
app.post('/', require('./createPdf'))

// Start listening on 3000 or configured port
const port = process.env.PORT || 3000
app.listen(port, () => {
    console.log('Service started. Listening on port', port)
})