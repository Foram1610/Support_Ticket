const { User, UserRole, sequelize } = require('../models')
const transport = require('../config/sendmail')
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs')
const { Op } = require('sequelize');
const userRoles = require('../config/ConstantData.json')
const { getAllData } = require('../middleware/getAllData')
const ejs = require('ejs')

exports.addUser = async (req, res) => {
    try {
        const { firstName, middleName, lastName, email, designation, mobileNo, employeeCode, userRoleId, agentId } = req.body;
        const user = await User.findOne({ where: { email: email } })
        if (user) {
            return res.status(409).json({ message: 'User already exits!!' });
        }
        const user1 = await User.create({
            firstName, middleName, lastName, email, designation, mobileNo, employeeCode, agentId, userRoleId: userRoleId, avatar: 'def.png', addedBy: req.logInid,
        })
        if (!user1) {
            return res.status(400).json({ data: `User's Data is not inserted!!` })
        }
        const token = jwt.sign({
            username: email,
        }, process.env.SECRET_KEY, { expiresIn: '5h' });
        await User.update(
            {
                resetPasswordToken: token,
                expireToken: new Date().getTime() + 300 * 1000
            },
            { where: { email: email } })
        const templateData = {
            firstName: firstName,
            middleName: middleName,
            lastName: lastName,
            email: email,
            url: process.env.EMAIL,
            token: token
        }
        const template = await ejs.renderFile("/Users/c100-89/Desktop/Foram/Narola_Support_Task/views/setPassword.ejs", templateData);

        const mailOptions = {

            from: 'no-reply<fparmar986@gmail.com>',
            to: email,
            subject: 'Set Your Password',
            html: template
        }
        transport.sendMail(mailOptions)
        if (!transport) {
            return res.status(404).json({ message: 'Somthing went wrong!!Can not sent mail to your email!!' })
        }
        else {
            return res.status(200).json({ message: `User's Data inserted!! Invitation sent to user's email!!!`, data: 2 })
        }

    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
}

exports.updateUser = async (req, res) => {
    try {
        const { firstName, middleName, lastName, email, designation, mobileNo, employeeCode, agentId } = req.body;
        const userCheck = await User.findOne({ where: { id: req.params.id } })
        let avatar;
        if (req.file === undefined) {
            avatar = userCheck.avatar
        }
        else {
            avatar = req.file.filename;
        }
        // console.log('Filename ==> ', req.file.filename)
        if (!userCheck) {
            return res.status(400).json({ message: `User does not exist!!` })
        }
        else {
            const user1 = await User.update({
                firstName, middleName, lastName, email, designation, mobileNo, employeeCode, avatar: avatar, agentId
            }, { where: { id: req.params.id } })
            if (!user1) {
                return res.status(400).json({ message: `User's Data is not updated!!` })
            }
            return res.status(200).json({ message: `User's Data updated!!` })
        }
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
}

exports.deleteUser = async (req, res) => {
    try {
        const userCheck = await User.findOne({ where: { id: req.params.id } })
        if (!userCheck) {
            return res.status(400).json({ message: `User does not exist!!` })
        }
        else {
            const user = await User.update({
                isDeleted: true,
                isActive: false
            }, { where: { id: req.params.id } })
            if (!user) {
                return res.status(400).json({ message: `User's Data is not deleted!!` })
            }
            return res.status(200).json({ message: `User's Data deleted!!` })
        }
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
}

exports.userStatusChange = async (req, res) => {
    try {
        const userCheck = await User.findOne({ where: { id: req.params.id } })
        let filter = { isActive: true }
        if (!userCheck) {
            return res.status(400).json({ message: `User does not exist!!` })
        }
        else {
            if (userCheck.isActive === true) {
                filter = {
                    isActive: false
                }
            }
            const user = await User.update(filter, { where: { id: req.params.id } })
            if (!user) {
                return res.status(400).json({ message: 'somthing went wrong!!' })
            }
            return res.status(200).json({ message: `User's status changed!!` })
        }
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
}

exports.updateUserProfile = async (req, res) => {
    try {
        const { firstName, middleName, lastName, email, designation, mobileNo, employeeCode } = req.body;
        const userCheck = await User.findOne({ where: { id: req.logInid } })
        let avatar;
        if (!userCheck) {
            return res.status(400).json({ message: `User does not exist!!` })
        }
        else {
            if (req.file === undefined) {
                avatar = userCheck.avatar
            }
            else {
                avatar = req.file.filename;
            }
            const user1 = await User.update({
                firstName, middleName, lastName, email, designation, mobileNo, employeeCode, avatar: avatar
            }, { where: { id: req.logInid } })
            if (!user1) {
                return res.status(400).json({ message: `User's Data is not updated!!` })
            }
            return res.status(200).json({ message: `User's Data updated!!` })
        }
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
}

exports.resetPassword = async (req, res) => {
    try {
        const { currpassword, password } = req.body
        const check = await User.findOne({ where: { id: req.logInid } })
        const isMatch = await bcrypt.compare(currpassword, check.password)
        if (!isMatch) {
            return res.status(400).json({ message: 'Current password is invalid!!' });
        }
        const hash = bcrypt.hashSync(password, 10);
        const passswordStatus = await User.update({ password: hash }, { where: { id: req.logInid } })
        if (!passswordStatus) {
            return res.status(400).json({ message: 'Somthing went wrong!!' })
        }
        return res.status(200).json({ message: 'Password changed!!' })
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
}

exports.getUserById = async (req, res) => {
    try {
        const user = await User.findOne({
            where: { id: req.params.id },
            attributes: { exclude: ['createdAt', 'updatedAt', 'updatedAt', 'password', 'resetPasswordToken', 'expireToken', 'wrongAttempt'] },
            include: [
                {
                    model: UserRole,
                    as: 'roletype',
                    attributes: ['role', 'isActive']
                },
                {
                    model: User,
                    as: 'added',
                    attributes: ['firstName', 'lastName', 'id']
                },
                {
                    model: User,
                    as: 'agent',
                    attributes: ['firstName', 'lastName', 'id']
                }
            ],
        })
        if (!user) {
            return res.status(400).json({ message: 'User not exist!!!!' })
        }
        return res.status(200).json({ data: user })
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
}

// exports.displayUsers = async (req, res) => {
//     try {
//         let conditions = [{ isDeleted: false }], sorting = [], filter = []
//         if (req.logIntype === userRoles.ROLE.MODERATOR) {
//             conditions = [
//                 { isDeleted: false }, { addedBy: req.logInid }
//             ]
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
//             filter.push(keyword)
//         }

//         if (req.body && req.body.hasOwnProperty('filters')) {
//             if (req.body.filters.userRoleId) {
//                 filter.push({ userRoleId: req.body.filters.userRoleId })
//             }
//             if (req.body.filters.addedBy) {
//                 filter.push({ addedBy: req.body.filters.addedBy })
//             }
//         }

//         if (req.body && req.body.hasOwnProperty('sortBy')) {
//             if (req.body.sortBy.userRoleId) {
//                 sorting.push(['roletype', 'role', req.body.sortBy.userRoleId])
//             }
//             if (req.body.sortBy.firstName) {
//                 sorting.push(['firstName', req.body.sortBy.firstName])
//             }
//         }
//         else {
//             sorting.push(['createdAt', 'ASC'])
//         }


//         const user = await User.findAll({
//             where: {
//                 [Op.and]: [conditions, { isDeleted: false }, { email: { [Op.ne]: 'ashish1@narola.email' } }, filter]
//             },
//             attributes: {
//                 exclude: ['createdAt', 'updatedAt', 'updatedAt', 'password', 'resetPasswordToken', 'expireToken', 'wrongAttempt']
//             },
//             include: [
//                 {
//                     model: UserRole,
//                     as: 'roletype',
//                     attributes: ['role', 'isActive']
//                 },
//                 {
//                     model: User,
//                     as: 'added',
//                     attributes: ['firstName', 'lastName', 'id']
//                 },
//                 {
//                     model: User,
//                     as: 'agent',
//                     attributes: ['firstName', 'lastName', 'id']
//                 }
//             ],
//             order: sorting,

//             limit: limit,
//             offset: offset
//         })
//         if (!user) {
//             return res.status(400).json({ message: 'User not exist!!!!' })
//         }
//         const user1 = await User.findAll({
//             where: {
//                 [Op.and]: conditions, isDeleted: false, addedBy: { [Op.ne]: null }
//             }
//         })
//         const count = user1.length

//         if (offset === 0) {
//             var offset1 = 1
//         }
//         const Pagination = {
//             TotalData: count,
//             PageNo: offset1
//         }

//         return res.status(200).json({ data: user, pagination: Pagination })
//     } catch (error) {
//         return res.status(400).json({ message: error.message })
//     }
// }


exports.displayUsers = async (req, res) => {
    try {
        const option = { ...req.body }
        if (!option.hasOwnProperty('query')) {
            option['query'] = {};
        }
        option.query['isDeleted'] = false
        option.query['email'] = { [Op.ne]: 'ashish1@narola.email' }
        
        if (req.logIntype === userRoles.ROLE.MODERATOR) {
            option.query['addedBy'] = req.logInid
        }

        const user = await getAllData(option, User)
        return res.status(200).json(user)
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
}

exports.getUsersAccordingly = async (req, res) => {
    try {
        const user = await User.findAll({
            where: { userRoleId: req.params.id },
            attributes: {
                exclude: ['createdAt', 'updatedAt', 'password', 'resetPasswordToken', 'expireToken', 'wrongAttempt']
            },
            include: [{
                model: UserRole,
                as: 'roletype',
                attributes: ['role', 'isActive']
            },
            {
                model: User,
                as: 'added',
                attributes: ['firstName', 'lastName']
            }]
        })
        if (!user) {
            return res.status(400).json({ message: 'User not exist!!!!' })
        }
        return res.status(200).json({ data: user })
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
}

exports.getAddedByUsers = async (req, res) => {
    try {
        const user = await User.findAll({
            where: { [Op.or]: [{ userRoleId: userRoles.ROLE.ADMIN }, { userRoleId: userRoles.ROLE.MODERATOR }] },
            attributes: {
                exclude: ['createdAt', 'updatedAt', 'updatedAt', 'password', 'resetPasswordToken', 'expireToken', 'wrongAttempt']
            },
            include: [{
                model: UserRole,
                as: 'roletype',
                attributes: ['role', 'isActive']
            },
            {
                model: User,
                as: 'added',
                attributes: ['firstName', 'lastName']
            }]
        })
        if (!user) {
            return res.status(400).json({ message: 'User not exist!!!!' })
        }
        return res.status(200).json({ data: user })
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
}