const { User, Ticket, TicketType, TicketStatusChange, Feedback, Activities } = require('../models')
const { Op } = require('sequelize');
const jwt = require('jsonwebtoken');
const jwt_decode = require('jwt-decode')
const dataCheck = require('../config/ConstantData.json')
const path = require('path')
const transport = require('../config/sendmail')
const ejs = require('ejs')
const { getAllData } = require('../middleware/getAllData')

exports.addTicket = async (req, res) => {
    try {
        const { title, ticketTypeId, description } = req.body
        let docs = []
        const userEmail = await User.findOne({ where: { id: req.logInid } })
        if (req.files !== undefined) {
            for (i = 0; i < (req.files).length; i++) {
                let element = (req.files)[i];
                docs.push(element.filename)
            }
        }
        let ticket
        if (userEmail.agentId === null) {
            ticket = await Ticket.create({ userId: req.logInid, title, ticketTypeId, description, documents: docs })
            if (!ticket) {
                return res.status(400).json({ message: 'Ticket not generated!!' })
            }
            await TicketStatusChange.create({ ticketId: ticket.id, ticketStatus: dataCheck.STATUS.UNASSIGN })

            const templateData = {
                firstName: userEmail.firstName,
                middleName: userEmail.middleName,
                lastName: userEmail.lastName,
                url: process.env.STATUSEMAIL,
                id: ticket.id
            }

            const template = await ejs.renderFile("views/ticketGenerate.ejs", templateData);

            const mailOptions = {

                from: 'no-reply<fparmar986@gmail.com>',
                to: userEmail.email,
                subject: 'Ticket Generated',
                html: template
            }
            transport.sendMail(mailOptions)
            await Activities.create({ ticketId: ticket.id, activityName: dataCheck.ACTIVITIES.GENERATE })
            if (!transport) {
                return res.status(404).json({ message: 'Somthing went wrong!!Can not sent mail to your emailid!!' })
            }
            return res.status(200).json({ message: 'Ticket generated!! Please check your mail to track your ticket status.' })
        }
        else {
            ticket = await Ticket.create({ userId: req.logInid, title, ticketTypeId, description, documents: docs, agentId: userEmail.agentId, status: dataCheck.STATUS.TODO })
            if (!ticket) {
                return res.status(400).json({ message: 'Ticket not generated!!' })
            }
            // await TicketStatusChange.create({ ticketId: ticket.id, ticketStatus: dataCheck.STATUS.UNASSIGN })
            await TicketStatusChange.create({ ticketId: ticket.id, ticketStatus: dataCheck.STATUS.TODO })

            const templateData1 = {
                firstName: userEmail.firstName,
                middleName: userEmail.middleName,
                lastName: userEmail.lastName,
                agentFname: userEmail.firstName,
                agentLname: userEmail.lastName,
                url: process.env.STATUSEMAIL,
                id: req.params.id
            }
            const template1 = await ejs.renderFile("views/assignTicketAgent.ejs", templateData1);

            const mailOptions1 = {

                from: 'no-reply<fparmar986@gmail.com>',
                to: userEmail.email,
                subject: 'New Ticket Assigned',
                html: template1
            }
            transport.sendMail(mailOptions1)
            await Activities.create({ ticketId: ticket.id, activityName: dataCheck.ACTIVITIES.GENERATE })
            await Activities.create({ ticketId: ticket.id, activityName: dataCheck.ACTIVITIES.ASSIGN, oldStatus: dataCheck.STATUS.UNASSIGN, newStatus: dataCheck.STATUS.TODO })
            if (!transport) {
                return res.status(404).json({ message: 'Somthing went wrong!!Can not sent mail to your emailid!!' })
            }
            return res.status(200).json({ message: 'Ticket generated!! Please check your mail to track your ticket status.' })
        }
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
}

exports.updateTicket = async (req, res) => {
    try {
        const { ticketTypeId, description } = req.body
        const checkTicket = await Ticket.findByPk(req.params.id)
        let docs = []
        docs = checkTicket.documents
        if (req.files !== undefined) {
            for (i = 0; i < (req.files).length; i++) {
                let element = (req.files)[i];
                docs.push(element.filename)
            }
        }
        const ticket = await Ticket.update(
            { ticketTypeId, description, documents: docs },
            { where: { [Op.or]: [{ id: req.params.id }, { status: dataCheck.STATUS.UNASSIGN }] } }
        )
        if (!ticket) {
            return res.status(400).json({ message: 'You can not update ticket now!!' })
        }
        return res.status(200).json({ message: 'Ticket updated!!!' })
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
}

exports.deleteTicket = async (req, res) => {
    try {
        const ticket = await Ticket.findOne(
            { where: { [Op.and]: [{ id: req.params.id }, { status: dataCheck.STATUS.UNASSIGN }, { isDeleted: false }] } }
        )
        // console.log('Data ==> ', ticket)
        if (!ticket) {
            return res.status(400).json({ message: 'You can not delete ticket now!!' })
        }
        await ticket.destroy()
        return res.status(200).json({ message: 'Ticket deleted!!' })
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
}

exports.assignTicket = async (req, res) => {
    try {
        const { agentId } = req.body
        const checkTicket = await Ticket.findByPk(req.params.id)
        let assignTicket, activity, status
        if (checkTicket.status === dataCheck.STATUS.UNASSIGN) {
            assignTicket = await Ticket.update(
                { moderatorId: req.logInid, agentId: agentId, status: dataCheck.STATUS.TODO },
                { where: { id: req.params.id } }
            )
            await User.update({ agentId: agentId }, { where: { id: checkTicket.userId } })
            status = dataCheck.STATUS.TODO
            activity = dataCheck.ACTIVITIES.ASSIGN
        }
        else {
            assignTicket = await Ticket.update(
                { moderatorId: req.logInid, agentId: agentId, status: dataCheck.STATUS.INPROGRESS },
                { where: { id: req.params.id } }
            )
            status = dataCheck.STATUS.INPROGRESS
            activity = dataCheck.ACTIVITIES['CHANGE-AGENT']
        }
        const emailData = await Ticket.findByPk(req.params.id,
            {
                include: [
                    {
                        model: User,
                        as: 'user',
                        attributes: ['firstName', 'middleName', 'lastName', 'email', 'id']
                    },
                    {
                        model: User,
                        as: 'moderator',
                        attributes: ['firstName', 'lastName', 'email', 'id']
                    },
                    {
                        model: User,
                        as: 'agent',
                        attributes: ['firstName', 'lastName', 'email', 'id']
                    },
                ]
            })

        if (!assignTicket) {
            return res.status(400).json({ message: 'Ticket is not assigned!!!' })
        }
        await TicketStatusChange.create({ ticketId: req.params.id, ticketStatus: emailData.status })
        await Activities.create(
            {
                ticketId: req.params.id,
                oldStatus: checkTicket.status,
                newStatus: status,
                activityName: activity
            })


        const templateData = {
            firstName: emailData.user.firstName,
            middleName: emailData.user.middleName,
            lastName: emailData.user.lastName,
            agentFname: emailData.agent.firstName,
            agentLname: emailData.agent.lastName,
            // title: checkTicket.title,
            url: process.env.STATUSEMAIL,
            id: req.params.id
        }
        const template = await ejs.renderFile("views/assignTicket.ejs", templateData);

        const mailOptions = {

            from: 'no-reply<fparmar986@gmail.com>',
            to: emailData.user.email,
            subject: `Ticket #${checkTicket.id} ${activity}`,
            html: template
        }
        transport.sendMail(mailOptions)

        const template1 = await ejs.renderFile("views/assignTicketAgent.ejs", templateData);

        const mailOptions1 = {

            from: 'no-reply<fparmar986@gmail.com>',
            to: emailData.agent.email,
            subject: 'New Ticket Assigned',
            html: template1
        }
        transport.sendMail(mailOptions1)
        return res.status(200).json({ message: 'Ticket assigned to agent!! Please check your mail to track your ticket status.' })


    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
}

exports.displayTicket = async (req, res) => {
    try {
        let condition = { status: { [Op.ne]: dataCheck.STATUS.CLOSE } }, filter = [], sorting = [], search = []
        if (req.logIntype === dataCheck.ROLE.AGENT) {
            condition = { [Op.and]: [{ agentId: req.logInid }, { status: { [Op.ne]: dataCheck.STATUS.CLOSE } }] }
        }
        if (req.logIntype === dataCheck.ROLE.USERS) {
            condition = { userId: req.logInid, status: { [Op.ne]: dataCheck.STATUS.CLOSE } }
        }
        if (req.logIntype === dataCheck.ROLE.MODERATOR) {
            condition = { [Op.and]: [{ agentId: null }, { status: dataCheck.STATUS.UNASSIGN }] }
        }

        let limit = (req.body.perPage) ? parseInt(req.body.perPage) : 25
        let offset = (req.body.pageNo) ? (0 + (req.body.pageNo - 1) * limit) : 0

        if (req.body && req.body.hasOwnProperty('search')) {
            const keyword = {
                [Op.or]: [
                    {
                        firstName: {
                            [Op.iLike]: `%${req.body.search}%`,
                        }
                    },
                    {
                        lastName: {
                            [Op.iLike]: `%${req.body.search}%`,
                        }
                    },
                    {
                        email: {
                            [Op.iLike]: `%${req.body.search}%`,
                        }
                    },
                ]
            };
            search.push(keyword)
        }

        if (req.body && req.body.hasOwnProperty('filters')) {
            if (req.body.filters.status) {
                filter.push({ status: req.body.filters.status })
            }
            if (req.body.filters.ticketTypeId) {
                filter.push({ ticketTypeId: req.body.filters.ticketTypeId })
            }
            if (req.body.filters.agentId) {
                filter.push({ agentId: req.body.filters.agentId })
            }
        }

        if (req.body && req.body.hasOwnProperty('sortBy')) {
            if (req.body.sortBy.ticketTypeId) {
                sorting.push(['type', 'name', req.body.sortBy.ticketTypeId])
            }
            if (req.body.sortBy.status) {
                sorting.push(['status', req.body.sortBy.status])
            }
            sorting.push(['createdAt', 'DESC'])
        }
        else {
            sorting.push(['createdAt', 'DESC'])
        }

        const data = await Ticket.findAll({
            attributes: {
                exclude: ['updatedAt', 'isDeleted']
            },
            include: [
                {
                    model: User,
                    as: 'user',
                    where: search,
                    attributes: ['firstName', 'lastName', 'email', 'id'],
                },
                {
                    model: User,
                    as: 'agent',
                    attributes: ['firstName', 'lastName', 'id']
                },
                {
                    model: User,
                    as: 'assign',
                    attributes: ['firstName', 'lastName', 'id']
                },
                {
                    model: User,
                    as: 'moderator',
                    attributes: ['firstName', 'lastName', 'id']
                },
                {
                    model: TicketType,
                    as: 'type',
                    attributes: ['name', 'id']
                }
                , {
                    model: Feedback,
                    // where: { [Op.and]: [{ ticketId: req.params.id }] },
                    attributes: ['ticketId', 'id']
                }
            ],
            order: sorting,
            where: { [Op.and]: [condition, filter] },
            limit: limit,
            offset: offset
        })
        const ticket1 = await Ticket.findAll({
            where: condition
        })
        const count = ticket1.length

        if (offset === 0) {
            var offset1 = 1
        }
        const Pagination = {
            TotalData: count,
            PageNo: offset1
        }
        return res.status(200).json({ data: data, pagination: Pagination })
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
}

exports.getTicketById = async (req, res) => {
    try {

        // console.log('Id ==> ', parseInt(req.params.id))
        const ticket = await Ticket.findOne({
            where: { id: req.params.id },
            attributes: {
                exclude: ['updatedAt', 'isDeleted']
            },
            include: [{
                model: User,
                as: 'user',
                attributes: ['firstName', 'lastName', 'email', 'mobileNo', 'id']
            },
            {
                model: User,
                as: 'agent',
                attributes: ['firstName', 'lastName', 'id']
            },
            {
                model: User,
                as: 'assign',
                attributes: ['firstName', 'lastName', 'id']
            },
            {
                model: User,
                as: 'moderator',
                attributes: ['firstName', 'lastName', 'id']
            },
            {
                model: TicketType,
                as: 'type',
                attributes: ['name', 'id']
            },
            {
                model: Feedback,
                // where: { [Op.and]: [{ ticketId: req.params.id }] },
                attributes: ['ticketId', 'id']
            }
            ]
        })
        if (!ticket) {
            return res.status(400).json({ message: 'This ticket is not exist!!' })
        }
        return res.status(200).json({ data: ticket })
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
}

exports.downloadDocumnets = async (req, res) => {
    try {
        const filename = req.params.fileName
        let imgPath = path.join(__dirname, '../public/documents', filename)
        if (!imgPath) {
            return res.status(400).json({ message: 'There is no file like this!!' })
        }
        // return res.sendFile(imgPath)
        return res.download(imgPath)
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
}

exports.changeStatus = async (req, res) => {
    try {
        const { status, comment } = req.body
        let docs = []
        if (req.files !== undefined) {
            for (i = 0; i < (req.files).length; i++) {
                let element = (req.files)[i];
                docs.push(element.filename)
            }
        }
        const checkTicket = await TicketStatusChange.findOne({ where: { ticketId: req.params.ticketid } })
        const data = await Ticket.findByPk(req.params.ticketid,
            {
                include: [
                    {
                        model: User,
                        as: 'user',
                        attributes: ['firstName', 'lastName', 'email', 'mobileNo', 'id']
                    },
                    {
                        model: User,
                        as: 'agent',
                        attributes: ['firstName', 'lastName', 'email', 'mobileNo', 'id']
                    },
                ]
            })
        if (!checkTicket) {
            return res.status(400).json({ message: "Ticket not exist!!" })
        }
        else {
            if (!status) {

                const comm = await Activities.create(
                    {
                        ticketId: req.params.ticketid,
                        activityName: dataCheck.ACTIVITIES.COMMENT,
                        comment: comment,
                        documents: docs
                    })

                const templateData = {
                    firstName: data.user.firstName,
                    middleName: data.user.middleName,
                    lastName: data.user.lastName,
                    agentFname: data.agent.firstName,
                    agentLname: data.agent.lastName,
                    url: process.env.STATUSEMAIL,
                    id: req.params.ticketid
                }
                const template = await ejs.renderFile("views/addComment.ejs", templateData);

                const mailOptions = {

                    from: 'no-reply<fparmar986@gmail.com>',
                    to: data.user.email,
                    subject: `Ticket #${data.id} ${comm.activityName}`,
                    html: template
                }
                transport.sendMail(mailOptions)

                if (!transport) {
                    return res.status(404).json({ message: 'Somthing went wrong!!Can not sent mail to your emailid!!' })
                }
                return res.status(200).json({ message: 'Agent have some issue. Please check your mail to view the issue.' })
            }
            else {
                await Ticket.update({ status: status }, { where: { id: req.params.ticketid } })
                const changeStat = TicketStatusChange.create({ ticketId: req.params.ticketid, ticketStatus: status })

                if (!changeStat) {
                    return res.status(400).json({ message: "Status not updated!!" })
                }
                if (status === dataCheck.STATUS.CLOSE) {
                    const comm = await Activities.create(
                        {
                            ticketId: req.params.ticketid,
                            oldStatus: data.status,
                            newStatus: status,
                            activityName: dataCheck.ACTIVITIES.CLOSE,
                            comment: comment,
                            documents: docs
                        })
                    const token = jwt.sign({
                        id: req.params.ticketid.toString()
                    }, process.env.SECRET_KEY, { expiresIn: '1d' });

                    const templateData = {
                        firstName: data.user.firstName,
                        middleName: data.user.middleName,
                        lastName: data.user.lastName,
                        agentFname: data.agent.firstName,
                        agentLname: data.agent.lastName,
                        url: process.env.CLOSEEMAIL,
                        token: token
                    }
                    const template = await ejs.renderFile("views/resolvedTicket.ejs", templateData);

                    const mailOptions = {

                        from: 'no-reply<fparmar986@gmail.com>',
                        to: data.user.email,
                        subject: `Ticket #${data.id} ${comm.activityName}`,
                        html: template
                    }
                    transport.sendMail(mailOptions)

                    await Feedback.create({ ticketId: data.id, agentId: data.agentId, status: "unfilled" })

                    if (!transport) {
                        return res.status(404).json({ message: 'Somthing went wrong!!Can not sent mail to your emailid!!' })
                    }
                    return res.status(200).json({ message: 'Agent close the ticket!! Please check your mail' })
                }
                if (status === dataCheck.STATUS.BACKLOG) {
                    const comm = await Activities.create(
                        {
                            ticketId: req.params.ticketid,
                            oldStatus: data.status,
                            newStatus: status,
                            activityName: dataCheck.ACTIVITIES['BACK-LOG'],
                            comment: comment,
                            documents: docs
                        })

                    const templateData = {
                        firstName: data.user.firstName,
                        middleName: data.user.middleName,
                        lastName: data.user.lastName,
                        agentFname: data.agent.firstName,
                        agentLname: data.agent.lastName,
                        url: process.env.STATUSEMAIL,
                        id: req.params.ticketid
                    }
                    const template = await ejs.renderFile("views/backLogTicket.ejs", templateData);

                    const mailOptions = {

                        from: 'no-reply<fparmar986@gmail.com>',
                        to: data.user.email,
                        subject: `Ticket #${data.id} ${comm.activityName}`,
                        html: template
                    }
                    transport.sendMail(mailOptions)

                    if (!transport) {
                        return res.status(404).json({ message: 'Somthing went wrong!!Can not sent mail to your emailid!!' })
                    }
                    return res.status(200).json({ message: `Agent side's work is done!! Please check your mail` })
                }
                let comm
                if (!comment) {
                    comm = await Activities.create(
                        {
                            ticketId: req.params.ticketid,
                            oldStatus: data.status,
                            newStatus: status,
                            activityName: dataCheck.ACTIVITIES.STATUS,
                        })
                }
                else {
                    comm = await Activities.create(
                        {
                            ticketId: req.params.ticketid,
                            oldStatus: data.status,
                            newStatus: status,
                            activityName: dataCheck.ACTIVITIES.STATUS,
                            comment: comment,
                            documents: docs
                        })
                }
                const templateData = {
                    firstName: data.user.firstName,
                    middleName: data.user.middleName,
                    lastName: data.user.lastName,
                    url: process.env.STATUSEMAIL,
                    id: req.params.ticketid
                }
                const template = await ejs.renderFile("views/statusChangeTicket.ejs", templateData);

                const mailOptions = {

                    from: 'no-reply<fparmar986@gmail.com>',
                    to: data.user.email,
                    subject: `Ticket #${data.id} ${comm.activityName}`,
                    html: template
                }
                transport.sendMail(mailOptions)

                if (!transport) {
                    return res.status(404).json({ message: 'Somthing went wrong!!Can not sent mail to your emailid!!' })
                }
                return res.status(200).json({ message: 'Agent update the status!! Please check your mail to track your ticket status.' })
            }
        }
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
}

exports.timeLine = async (req, res) => {
    try {
        const checkTicket = await Activities.findAll({
            where: { ticketId: req.params.ticketid },
            include: [
                {
                    model: Ticket,
                    as: 'ticket',
                    attributes: ['userId', 'agentId', 'id'],
                    include: [
                        {
                            model: User,
                            as: 'user',
                            attributes: ['firstName', 'lastName', 'id'],
                        },
                        {
                            model: User,
                            as: 'agent',
                            attributes: ['firstName', 'lastName', 'id'],
                        }
                    ]
                }
            ],
            order: [['createdAt', 'DESC']],
        })
        if (!checkTicket) {
            return res.status(400).json({ message: "Ticket not exist!!" })
        }
        return res.status(200).json({ data: checkTicket })
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
}

// exports.resolved = async (req, res) => {
//     try {
//         let condition, filter = [], sorting = [], search = []
//         if (req.logIntype === dataCheck.ROLE.AGENT) {
//             condition = [{ agentId: req.logInid }]
//         }
//         if (req.logIntype === dataCheck.ROLE.USERS) {
//             condition = [{ userId: req.logInid }]
//         }
//         let limit = (req.body.perPage) ? parseInt(req.body.perPage) : 25
//         let offset = (req.body.pageNo) ? (0 + (req.body.pageNo - 1) * limit) : 0

//         if (req.body && req.body.hasOwnProperty('search')) {
//             const keyword = {
//                 [Op.or]: [
//                     {
//                         firstName: {
//                             [Op.iLike]: `%${req.body.search}%`,
//                         }
//                     },
//                     {
//                         lastName: {
//                             [Op.iLike]: `%${req.body.search}%`,
//                         }
//                     },
//                     {
//                         email: {
//                             [Op.iLike]: `%${req.body.search}%`,
//                         }
//                     },
//                 ]
//             };
//             search.push(keyword)
//         }

//         if (req.body && req.body.hasOwnProperty('filters')) {
//             if (req.body.filters.ticketTypeId) {
//                 filter.push({ ticketTypeId: req.body.filters.ticketTypeId })
//             }
//             if (req.body.filters.agentId) {
//                 filter.push({ agentId: req.body.filters.agentId })
//             }
//         }

//         if (req.body && req.body.hasOwnProperty('sortBy')) {
//             if (req.body.sortBy.ticketTypeId) {
//                 sorting.push(['type', 'name', req.body.sortBy.ticketTypeId])
//             }
//             sorting.push(['createdAt', 'DESC'])
//         }
//         else {
//             sorting.push(['createdAt', 'DESC'])
//         }

//         const displayData = await Ticket.findAll({
//             attributes: {
//                 exclude: ['updatedAt', 'documents', 'status']
//                 // exclude: ['updatedAt', 'documents', 'status']
//             },
//             include: [
//                 {
//                     model: User,
//                     as: 'user',
//                     where: search,
//                     attributes: ['firstName', 'lastName', 'email', 'id']
//                 },
//                 {
//                     model: TicketStatusChange,
//                     where: { ticketStatus: dataCheck.STATUS.CLOSE },
//                     attributes: ['ticketStatus', 'createdAt', 'id']
//                 },
//                 {
//                     model: User,
//                     as: 'agent',
//                     attributes: ['firstName', 'lastName', 'id']
//                 },
//                 {
//                     model: TicketType,
//                     as: 'type',
//                     attributes: ['name', 'id']
//                 }],
//             where: { [Op.and]: [condition, { status: dataCheck.STATUS.CLOSE }, filter] },
//             order: sorting,
//             limit: limit,
//             offset: offset
//         })

//         const resolvedTickets = await Ticket.findAll({
//             where: { [Op.and]: [condition, { status: dataCheck.STATUS.CLOSE }] },
//         })
//         const count = resolvedTickets.length

//         if (offset === 0) {
//             var offset1 = 1
//         }
//         const Pagination = {
//             TotalData: count,
//             PageNo: offset1
//         }

//         if (!displayData) {
//             return res.status(400).json({ message: 'Somthing went wrong!!!' })
//         }
//         return res.status(200).json({ data: displayData, pagination: Pagination })
//     } catch (error) {
//         return res.status(400).json({ message: error.message })
//     }
// }

exports.resolved = async (req, res) => {
    try {
        const option = { ...req.body }
        if (!option.hasOwnProperty('query')) {
            option['query'] = {};
        }
        option.query['isDeleted'] = false
        option.query['status'] = dataCheck.STATUS.CLOSE

        if (req.logIntype === dataCheck.ROLE.AGENT) {
            option.query['agentId'] = req.logInid
        }
        if (req.logIntype === dataCheck.ROLE.USERS) {
            option.query['userId'] = req.logInid
        }
        const resolvedTickets = await getAllData(option, Ticket)
        return res.status(200).json(resolvedTickets)
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
}

exports.getfeedback = async (req, res) => {
    try {
        const data = await Feedback.findOne({
            where: { ticketId: req.params.id },
            include: [
                {
                    model: Ticket,
                    as: 'ticket',
                    attributes: ['userId', 'title', 'feedbackStatus', 'id'],
                    include: [
                        {
                            model: User,
                            as: 'user',
                            attributes: ['firstName', 'lastName', 'email', 'mobileNo', 'id']
                        },
                        {
                            model: TicketStatusChange,
                            where: { ticketStatus: dataCheck.STATUS.CLOSE },
                            attributes: ['ticketStatus', 'createdAt', 'id']
                        }
                    ]
                },
                {
                    model: User,
                    as: 'agent',
                    attributes: ['firstName', 'lastName', 'id']
                },
            ]
        })
        if (!data) {
            return res.status(400).json({ message: 'Somthing went wrong!!!' })
        }
        return res.status(200).json({ data: data })
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
}

exports.getAllfeedback = async (req, res) => {
    try {
        let limit = (req.body.perPage) ? parseInt(req.body.perPage) : 25
        let offset = (req.body.pageNo) ? (0 + (req.body.pageNo - 1) * limit) : 0
        let condition = {}, condition1 = {}, filter = [], sorting = [], search = []
        if (req.logIntype === dataCheck.ROLE.AGENT) {
            condition = { agentId: req.logInid }
        }
        if (req.logIntype === dataCheck.ROLE.USERS) {
            condition1 = { userId: req.logInid }
        }
        // console.log('data ===>', condition)
        if (req.body && req.body.hasOwnProperty('search')) {
            const keyword = {
                [Op.or]: [
                    {
                        firstName: {
                            [Op.iLike]: `%${req.body.search}%`,
                        }
                    },
                    {
                        lastName: {
                            [Op.iLike]: `%${req.body.search}%`,
                        }
                    },
                    // {
                    //     title: {
                    //         [Op.iLike]: `%${req.body.search}%`,
                    //     }
                    // },
                ]
            };
            search.push(keyword)
        }


        if (req.body && req.body.hasOwnProperty('filters')) {
            if (req.body.filters.rating) {
                filter.push({ rating: req.body.filters.rating })
            }
            if (req.body.filters.agentId) {
                filter.push({ agentId: req.body.filters.agentId })
            }
        }

        // if (req.body && req.body.hasOwnProperty('sortBy')) {
        //     if (req.body.sortBy.ticketId) {
        //         sorting.push(['ticket', 'firstName', req.body.sortBy.ticketId])
        //     }
        //     sorting.push(['createdAt', 'DESC'])
        // }
        // else {
        sorting.push(['createdAt', 'DESC'])
        // }

        const data = await Feedback.findAll({
            include: [
                {
                    model: Ticket,
                    as: 'ticket',
                    attributes: ['userId', 'title', 'feedbackStatus', 'id'],
                    where: condition1,
                    include: [
                        {
                            model: User,
                            as: 'user',
                            where: search,
                            attributes: ['firstName', 'lastName', 'email', 'mobileNo', 'id']
                        },
                        {
                            model: TicketStatusChange,
                            where: { ticketStatus: dataCheck.STATUS.CLOSE },
                            attributes: ['ticketStatus', 'createdAt', 'id']
                        }
                    ]
                },
                {
                    model: User,
                    as: 'agent',
                    attributes: ['firstName', 'lastName', 'id']
                },
            ],
            where: { [Op.and]: [condition, filter] },
            limit: limit,
            offset: offset,
            order: sorting,
        })
        if (!data) {
            return res.status(400).json({ message: 'Somthing went wrong!!!' })
        }
        const feedbacks = await Feedback.findAll({ where: condition })
        const count = feedbacks.length

        if (offset === 0) {
            var offset1 = 1
        }
        const Pagination = {
            TotalData: count,
            PageNo: offset1
        }
        return res.status(200).json({ data: data, pagination: Pagination })
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
}

exports.feedback = async (req, res) => {
    try {
        const { ticketId, feedback, rating } = req.body
        const checkTicket = await Ticket.findByPk(ticketId, { where: { status: dataCheck.STATUS.CLOSE } })
        if (!checkTicket) {
            return res.status(400).json({ message: 'Ticket not exist!!!' })
        }
        else {
            const data = await Feedback.update({ feedback: feedback, rating: rating }, { where: { id: req.params.id } })
            if (!data) {
                return res.status(400).json({ message: 'Feedback not added!!!' })
            }
            await Ticket.update({ feedbackStatus: "fullfilled" }, { where: { ticketId: ticketId } })
            return res.status(200).json({ message: 'Feedback added successfully!!' })
        }
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
}
// exports.feedback = async (req, res) => {
//     try {
//         const { token, feedback, rating } = req.body
//         var decoded = jwt_decode(token);
//         console.log(decoded);
//         const checkTicket = await Ticket.findByPk(decoded.id, { where: { status: dataCheck.STATUS.CLOSE } })
//         if (!checkTicket) {
//             return res.status(400).json({ message: 'Ticket not exist!!!' })
//         }
//         else {
//             const data = await Feedback.create({ ticketId: decoded.id, agentId: checkTicket.agentId, feedback, rating })
//             if (!data) {
//                 return res.status(400).json({ message: 'Feedback not added!!!' })
//             }
//             return res.status(200).json({ message: 'Feedback added successfully!!' })
//         }
//     } catch (error) {
//         return res.status(400).json({ message: error.message })
//     }
// }