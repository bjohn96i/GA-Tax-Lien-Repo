const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const dotenv = require('dotenv')

const properties = require('./routes/properties')

dotenv.config()
const app = express()

const config = {
    port: process.env.PORT
}

app.use(cors())
app.use(express.json())

app.use('/properties', properties)


app.get('*', (req, res) => {
    res.status(404).json({
        message: "PATH NOT FOUND!"
    })
})

const start = async () => {
    const options = {
        autoIndex: true
      }
    try {
        console.log('Connecting to DB...')
        await mongoose.connect(
            process.env.DB_URI, options
          );
        app.listen(config.port, () => console.log(`Server is now listening on port: ${config.port}`))
    } catch (error) {
        console.error(error)
        process.exit(1)
    }
};
start()