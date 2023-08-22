const express = require('express')
const route = express.Router()
const ticket = require('../controller/ticket.controller')
const documents = require('../middleware/documentsUplode')
const auth = require('../middleware/auth')

route.post('/ticket/changeStatus/:ticketid', auth, documents.array('docs', 5),ticket.changeStatus)
route.post('/ticket', auth, documents.array('docs', 5), ticket.addTicket)
route.put('/ticket/:id',auth, documents.array('docs', 5), ticket.updateTicket)
route.delete('/ticket/:id', auth,ticket.deleteTicket)
route.post('/_ticket', auth, ticket.displayTicket)
route.get('/ticket/:id', ticket.getTicketById)
route.put('/ticket/assign/:id', auth, ticket.assignTicket)
route.get('/downloadDocs/:fileName', ticket.downloadDocumnets)
route.get('/ticket/timeLine/:ticketid', ticket.timeLine)
route.post('/ticket/feedback/:id',auth,ticket.feedback)
route.post('/ticket/resolved', auth, ticket.resolved)
// route.post('/ticket/unassign', auth, ticket.displayUnassignTicket)
route.get('/ticket/getFeedback/:id', auth, ticket.getfeedback)
route.post('/getAllFeedback', auth, ticket.getAllfeedback)


module.exports = route