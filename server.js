const express = require('express')
const app = express()
const path = require('path')
const cors = require('cors')
require('dotenv').config()
require('./config/config.json')
const routes = require('./routes/index')
const morgan = require('morgan')

app.use(cors())
app.use(express.json())

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'));
app.use("/avatar", express.static(path.join(__dirname, '/public/avatar')));
app.use("/file", express.static(path.join(__dirname, '/public/documents')));

app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*")
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept"
    );
    next();
})

app.use(morgan('tiny'))
app.use('/api', routes)

const PORT = process.env.PORT || 8080
app.listen(PORT, async () => {
    console.log(`Server runnig on port ${PORT}!!!`)
    // await sequelize.authenticate()
    console.log('Database connected!!')
})