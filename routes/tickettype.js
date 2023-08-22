const express = require('express')
const route = express.Router()
const tickettype = require('../controller/tickettype.controller')
const auth = require('../middleware/auth')

route.post('/tickettype', auth, tickettype.addTicketType)
route.put('/tickettype/:id', auth, tickettype.updateTicketType)
route.delete('/tickettype/:id', auth, tickettype.deleteTicketType)
route.post('/_tickettype', tickettype.displayTicketType)
route.get('/tickettype/:id', auth, tickettype.getTicketType)
route.get('/tickettype', tickettype.getAllTickets)

module.exports = route