const { User, TicketType } = require('../models')
const { Op } = require('Sequelize')
const { getAllData } = require('../middleware/getAllData')

exports.addTicketType = async (req, res) => {
    try {
        const { name, description } = req.body
        const data = await TicketType.create({ name: name, description: description, addedBy: req.logInid })
        if (!data) {
            return res.status(400).json({ message: 'Somthing went wrong!!' })
        }
        return res.status(200).json({ message: 'Ticket type inserted!!!' })
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
}

exports.updateTicketType = async (req, res) => {
    try {
        const { name, description } = req.body
        const checkTicket = await TicketType.findByPk(req.params.id)
        if (!checkTicket) {
            return res.status(400).json({ message: 'User does not exist!!' })
        }
        else {
            const data = await TicketType.update({ name: name, description: description }, { where: { id: req.params.id } })
            if (!data) {
                return res.status(400).json({ message: 'Ticket type is not updated!!!' })
            }
        }
        return res.status(200).json({ message: 'Ticket type updated!!!' })
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
}

exports.deleteTicketType = async (req, res) => {
    try {
        const checkTicket = await TicketType.findByPk(req.params.id)
        if (!checkTicket) {
            return res.status(400).json({ message: 'User does not exist!!' })
        }
        else {
            const data = await checkTicket.destroy()
            if (!data) {
                return res.status(400).json({ message: 'Ticket type is not deleted!!!' })
            }
        }
        return res.status(200).json({ message: 'Ticket type deleted!!!' })
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
}

exports.getAllTickets = async (req, res) => {
    try {
        const data = await TicketType.findAll()
        return res.status(200).json({ data: data })
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
}

// exports.displayTicketType = async (req, res) => {
//     try {
//         let filter = [], sorting = []
//         let limit = (req.body.perPage) ? parseInt(req.body.perPage) : 25
//         let offset = (req.body.pageNo) ? ((req.body.pageNo - 1) * limit) : 0

//         if (req.body && req.body.hasOwnProperty('search')) {
//             const keyword = {
//                 [Op.or]: [
//                     {
//                         name: {
//                             [Op.iLike]: `%${req.body.search}%`,
//                         }
//                     }
//                 ]
//             };
//             filter.push(keyword)    
//         }

//         if (req.body && req.body.hasOwnProperty('filters')) {
//             if (req.body.filters.addedBy) {
//                 filter.push({ addedBy: req.body.filters.addedBy })
//             }
//         }

//         if (req.body && req.body.hasOwnProperty('sortBy')) {
//             if (req.body.sortBy.name) {
//                 sorting.push(['name', req.body.sortBy.name])
//             }
//             if (req.body.sortBy.addedBy) {
//                 sorting.push(['admin', 'firstName', req.body.sortBy.addedBy])
//             }
//         }

//         const data = await TicketType.findAll({
//             where: { [Op.and]: filter },
//             include: [
//                 {
//                     model: User,
//                     as: 'admin',
//                     attributes: ['firstName', 'lastName']
//                 }
//             ],
//             limit: limit,
//             offset: offset,
//             order: sorting
//         })
//         const tickettype1 = await TicketType.findAll()
//         const count = tickettype1.length

//         if (offset === 0) {
//             var offset1 = 1
//         }
//         const Pagination = {
//             TotalData: count,
//             PageNo: offset1
//         }
//         return res.status(200).json({ data: data, pagination: Pagination })
//     } catch (error) {
//         return res.status(400).json({ message: error.message })
//     }
// }

exports.displayTicketType = async (req, res) => {
    try {
        const ticketType = await getAllData(req.body, TicketType)
        return res.status(200).json(ticketType)
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
}

exports.getTicketType = async (req, res) => {
    try {
        const data = await TicketType.findByPk(req.params.id, {
            include: [
                {
                    model: User,
                    as: 'admin',
                    attributes: ['firstName', 'lastName']
                }
            ]
        })
        return res.status(200).json({ data: data })
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
}
