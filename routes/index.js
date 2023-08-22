const express = require('express')
const route = express.Router()
const userrole = require('./userrole')
const user = require('./user')
const auth = require('./auth')
const tickettype = require('./tickettype')
const ticket = require('./ticket')

route.use(userrole, user, auth, tickettype, ticket)

module.exports = route