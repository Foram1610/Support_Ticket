const express = require('express')
const route = express.Router()
const role = require('../controller/userrole.controller')

route.post('/userrole',role.insertRole)
route.post('/_userrole',role.getRole)

module.exports = route