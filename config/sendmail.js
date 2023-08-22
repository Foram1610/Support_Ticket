const nodemailer = require('nodemailer');
const hbs = require('nodemailer-express-handlebars')
// const d = require('../views/email')
// const sendgridTransport = require('nodemailer-sendgrid-transport');

// const transport = nodemailer.createTransport(sendgridTransport({
//     auth: {
//         api_key: process.env.SENDGRID_KEY
//     }
// }))

var transport = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: true,
    auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
    }
});


module.exports = transport