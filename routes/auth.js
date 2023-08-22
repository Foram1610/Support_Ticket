const express = require('express')
const route = express.Router()
const auth = require('../controller/auth.controller')
const auth1 = require('../middleware/auth')
const { login, Email, Password, valResult, checkUser } = require('../middleware/validation')

route.post('/registration', checkUser, valResult, auth.userRegistration)
route.post('/forgotPassword', Password, valResult, auth.forgotPassword)
route.post('/login', login, valResult, auth.login)
route.post('/forgotPasswordLink', Email, valResult, auth.forgotPassLink)
route.get('/me', auth1, auth.me)

module.exports = route