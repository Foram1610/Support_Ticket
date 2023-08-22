const { User, UserRole, Ticket, TicketStatusChange, TicketType, Feedback, Activities } = require('../models')

const includeFields = [
    {
        "field": "userRoleId",
        "as": "roletype",
        "model": UserRole
    },
    {
        "field": "addedBy",
        "as": "added",
        "model": User
    },
    {
        "field": "agentId",
        "as": "agent",
        "model": User
    },
    {
        "field": "userId",
        "as": "user",
        "model": User
    },
    {
        "field": "moderatorId",
        "as": "moderator",
        "model": User
    },
    {
        "field": "agentId",
        "as": "agent",
        "model": User
    },
    {
        "field": "assignBy",
        "as": "assign",
        "model": User
    },
    {
        "field": "addedBy",
        "as": "admin",
        "model": User
    },
    {
        "field": "ticketTypeId",
        "as": "type",
        "model": TicketType
    },
    {
        "field": "ticketId",
        "as": "status",
        "model": Ticket
    },
    {
        "field": "ticketId",
        "as": "ticket",
        "model": Ticket
    },
]

module.exports = { includeFields }